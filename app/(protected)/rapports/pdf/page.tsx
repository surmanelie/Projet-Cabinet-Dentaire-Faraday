import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import SectionLabel from "@/components/SectionLabel";
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
    <div className="max-w-2xl space-y-8">
      <div>
        <SectionLabel>Rapports</SectionLabel>
        <h1 className="mt-3 font-serif text-4xl italic text-ardoise-900">Export PDF</h1>
      </div>
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
