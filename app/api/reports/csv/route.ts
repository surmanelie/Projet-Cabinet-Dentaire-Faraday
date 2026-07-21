import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import { computeMonthlyRecap } from "@/lib/actions/monthly-validation";
import { generateGlobalAccountingCsv } from "@/lib/csv";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!isAdminOrRh(session.role) && session.role !== "COMPTABLE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  if (!month || !year) {
    return NextResponse.json({ error: "Paramètres month/year requis" }, { status: 400 });
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

  const csv = generateGlobalAccountingCsv(rows, month, year);

  await writeAuditLog({
    actorId: session.id,
    action: "EXPORT_CSV_GLOBAL",
    entityType: "Report",
    newValue: { month, year },
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="export-comptable-${month}-${year}.csv"`,
    },
  });
}
