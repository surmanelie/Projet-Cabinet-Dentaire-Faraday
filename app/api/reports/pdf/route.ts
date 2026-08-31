import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import { computeMonthlyRecap } from "@/lib/actions/monthly-validation";
import { generateEmployeeRecapPdf, generateGlobalAccountingPdf } from "@/lib/pdf";
import { getCabinetSettings, getRulesConfig } from "@/lib/rules";
import { computeDayMinutes } from "@/lib/hours-engine";
import { writeAuditLog } from "@/lib/audit";
import { startOfParisDay, endOfParisDay } from "@/lib/timezone";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const userId = searchParams.get("userId");
  const scope = searchParams.get("scope") ?? "employee"; // "employee" | "global"

  if (!month || !year) {
    return NextResponse.json({ error: "Paramètres month/year requis" }, { status: 400 });
  }

  const settings = await getCabinetSettings();

  if (scope === "global") {
    if (!isAdminOrRh(session.role) && session.role !== "COMPTABLE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { active: true, role: { in: ["ASSISTANT", "PRATICIEN"] } },
      orderBy: { lastName: "asc" },
    });

    const rows = await Promise.all(
      users.map(async (u) => ({
        employeeName: `${u.firstName} ${u.lastName}`,
        summary: await computeMonthlyRecap(u.id, month, year),
      }))
    );

    const pdfBuffer = await generateGlobalAccountingPdf(settings.name, month, year, rows);

    await writeAuditLog({
      actorId: session.id,
      action: "EXPORT_PDF_GLOBAL",
      entityType: "Report",
      newValue: { month, year },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="synthese-comptable-${month}-${year}.pdf"`,
      },
    });
  }

  // Scope employé : un salarié ne peut télécharger que son propre PDF, sauf ADMIN/RH.
  const targetUserId = userId ?? session.id;
  if (targetUserId !== session.id && !isAdminOrRh(session.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const validation = await prisma.monthlyValidation.findUnique({
    where: { userId_month_year: { userId: targetUserId, month, year } },
  });

  const summary = await computeMonthlyRecap(targetUserId, month, year);

  // Détail jour par jour des heures RÉELLEMENT pointées (jamais le planning
  // théorique) — dates, horaires réels, pause, total du jour — exigé sur le
  // PDF individuel en plus du récapitulatif agrégé.
  const start = startOfParisDay(new Date(year, month - 1, 1));
  const end = endOfParisDay(new Date(year, month - 1, new Date(year, month, 0).getDate()));
  const rules = await getRulesConfig();
  const workedEntries = await prisma.workEntry.findMany({
    where: { userId: targetUserId, date: { gte: start, lte: end }, actualStart: { not: null }, actualEnd: { not: null } },
    orderBy: { date: "asc" },
  });
  const dailyEntries = workedEntries.map((e) => ({
    date: e.date,
    actualStart: e.actualStart as string,
    actualEnd: e.actualEnd as string,
    breakMinutes: e.breakMinutes,
    totalMinutes: computeDayMinutes(
      { start: e.actualStart as string, end: e.actualEnd as string, breakMinutes: e.breakMinutes },
      rules.rounding
    ),
  }));

  // Détail des absences acceptées sur la période (arrêts maladie, congés,
  // formation...) — pour le comptable, en bas du récapitulatif.
  const absenceRows = await prisma.absence.findMany({
    where: { userId: targetUserId, status: "ACCEPTE", startDate: { lte: end }, endDate: { gte: start } },
    orderBy: { startDate: "asc" },
  });
  const absences = absenceRows.map((a) => ({
    type: a.type,
    startDate: a.startDate,
    endDate: a.endDate,
    hours: a.hours,
  }));

  const pdfBuffer = await generateEmployeeRecapPdf({
    cabinetName: settings.name,
    employeeName: `${user.firstName} ${user.lastName}`,
    month,
    year,
    summary,
    status: validation?.status ?? "EN_PREPARATION",
    dailyEntries,
    absences,
  });

  await writeAuditLog({
    actorId: session.id,
    action: "EXPORT_PDF_EMPLOYEE",
    entityType: "Report",
    entityId: targetUserId,
    newValue: { month, year },
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recap-${user.lastName}-${month}-${year}.pdf"`,
    },
  });
}
