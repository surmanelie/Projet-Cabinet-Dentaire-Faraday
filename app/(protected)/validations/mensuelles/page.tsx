import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { computeMonthlyRecap } from "@/lib/actions/monthly-validation";
import SectionLabel from "@/components/SectionLabel";
import GenerateRecapForm from "./GenerateRecapForm";
import ValidationActions from "./ValidationActions";

const STATUS_LABELS: Record<string, string> = {
  EN_PREPARATION: "En préparation",
  ENVOYE_AU_SALARIE: "Envoyé au salarié",
  VALIDE_SALARIE: "Validé par le salarié",
  REFUSE_SALARIE: "Refusé par le salarié",
  VALIDE_RH: "Validé RH",
  VERROUILLE: "Verrouillé",
};

const STATUS_STYLES: Record<string, string> = {
  EN_PREPARATION: "bg-ardoise-100 text-ardoise-600",
  ENVOYE_AU_SALARIE: "bg-amber-50 text-amber-700",
  VALIDE_SALARIE: "bg-faraday-50 text-faraday-700",
  REFUSE_SALARIE: "bg-red-50 text-red-700",
  VALIDE_RH: "bg-blue-50 text-blue-700",
  VERROUILLE: "bg-ardoise-200 text-ardoise-700",
};

export default async function MonthlyValidationsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN" && session.role !== "RH") redirect("/dashboard");

  const params = await searchParams;
  const now = new Date();
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();

  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ["ASSISTANT", "PRATICIEN"] } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: "asc" },
  });

  const validations = await prisma.monthlyValidation.findMany({
    where: { month, year },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  const recaps = await Promise.all(
    validations.map(async (v) => ({ validation: v, summary: await computeMonthlyRecap(v.userId, month, year) }))
  );

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Validations</SectionLabel>
        <h1 className="mt-3 page-title">
          Validations mensuelles — {month}/{year}
        </h1>
      </div>

      <div className="card">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Générer un récapitulatif</p>
        <GenerateRecapForm users={users} month={month} year={year} />
      </div>

      <div className="card overflow-x-auto">
        {recaps.length === 0 ? (
          <p className="text-sm text-ardoise-400">Aucun récapitulatif généré pour cette période.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ardoise-200 text-left text-[11px] uppercase tracking-wider2 text-ardoise-400">
                <th className="pb-3 pr-4">Utilisateur</th>
                <th className="pb-3 pr-4">Prévu</th>
                <th className="pb-3 pr-4">Travaillé</th>
                <th className="pb-3 pr-4">Solde</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {recaps.map(({ validation, summary }) => (
                <tr key={validation.id} className="border-b border-ardoise-100 last:border-0">
                  <td className="py-3.5 pr-4">
                    {validation.user.firstName} {validation.user.lastName}
                  </td>
                  <td className="py-3.5 pr-4">{summary.totalPlannedHours.toFixed(1)} h</td>
                  <td className="py-3.5 pr-4">{summary.totalWorkedHours.toFixed(1)} h</td>
                  <td className="py-3.5 pr-4 font-medium">
                    {summary.balanceHours >= 0 ? "+" : ""}
                    {summary.balanceHours.toFixed(1)} h
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`badge ${STATUS_STYLES[validation.status]}`}>
                      {STATUS_LABELS[validation.status]}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <ValidationActions validationId={validation.id} status={validation.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
