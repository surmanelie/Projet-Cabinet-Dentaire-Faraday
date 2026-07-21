import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import { computeMonthlyRecap } from "@/lib/actions/monthly-validation";
import { generateEmployeeRecapPdf, generateGlobalAccountingPdf } from "@/lib/pdf";
import { getCabinetSettings } from "@/lib/rules";
import { writeAuditLog } from "@/lib/audit";

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
  const pdfBuffer = await generateEmployeeRecapPdf({
    cabinetName: settings.name,
    employeeName: `${user.firstName} ${user.lastName}`,
    month,
    year,
    summary,
    status: validation?.status ?? "EN_PREPARATION",
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
