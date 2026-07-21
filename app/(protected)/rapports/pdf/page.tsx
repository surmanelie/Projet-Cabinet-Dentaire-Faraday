import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import PdfExportForm from "./PdfExportForm";

export default async function RapportsPdfPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canSeeGlobal = isAdminOrRh(session.role) || session.role === "COMPTABLE";

  const users = canSeeGlobal
    ? await prisma.user.findMany({
        where: { active: true, role: { in: ["ASSISTANT", "PRATICIEN"] } },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: "asc" },
      })
    : [];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-ardoise-900">Export PDF</h1>
      <div className="card">
        <PdfExportForm
          canSeeGlobal={canSeeGlobal}
          users={users}
          ownUserId={session.id}
          isAdminOrRh={isAdminOrRh(session.role)}
        />
      </div>
    </div>
  );
}
