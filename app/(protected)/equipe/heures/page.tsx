import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeMonthlyRecap } from "@/lib/actions/monthly-validation";
import SectionLabel from "@/components/SectionLabel";

const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function formatHours(h: number) {
  const sign = h > 0 ? "+" : "";
  return `${sign}${h.toFixed(1)} h`;
}

export default async function HeuresEquipePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();

  // Seuls les employés pointent : l'administrateur et les rôles de gestion
  // (RH, comptable) n'ont pas d'horaires ni de suivi d'heures.
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ["ASSISTANT", "PRATICIEN"] } },
    orderBy: [{ lastName: "asc" }],
  });

  const rows = await Promise.all(
    users.map(async (u) => {
      try {
        const summary = await computeMonthlyRecap(u.id, month, year);
        return { user: u, summary, error: null as string | null };
      } catch {
        return { user: u, summary: null, error: "Aucune donnée" };
      }
    })
  );

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>Équipe</SectionLabel>
          <h1 className="mt-3 font-serif text-4xl italic text-ardoise-900">Suivi des heures</h1>
          <p className="mt-2 text-sm text-ardoise-500">
            Heures travaillées vs. heures contractuelles, par personne, pour le mois sélectionné. Le solde indique
            les heures manquantes (négatif) ou les heures en plus / supplémentaires (positif).
          </p>
        </div>
        <Link href="/equipe" className="btn-ghost text-sm">
          ← Retour à l&apos;équipe
        </Link>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Link
          href={`/equipe/heures?month=${prevMonth}&year=${prevYear}`}
          className="btn-secondary px-3 py-1.5"
        >
          ← {MONTH_LABELS[prevMonth - 1]}
        </Link>
        <span className="font-semibold text-ardoise-900">
          {MONTH_LABELS[month - 1]} {year}
        </span>
        <Link
          href={`/equipe/heures?month=${nextMonth}&year=${nextYear}`}
          className="btn-secondary px-3 py-1.5"
        >
          {MONTH_LABELS[nextMonth - 1]} →
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ardoise-400">
              <th className="py-2">Nom</th>
              <th className="py-2">Heures contractuelles</th>
              <th className="py-2">Heures travaillées</th>
              <th className="py-2">Heures supplémentaires</th>
              <th className="py-2">Heures manquantes</th>
              <th className="py-2">Solde</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ user, summary, error }) => (
              <tr key={user.id} className="border-t border-ardoise-100">
                <td className="py-2">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: user.color }} />
                  <Link href={`/planning?user=${user.id}`} className="font-medium text-faraday-700 hover:underline">
                    {user.firstName} {user.lastName}
                  </Link>
                </td>
                {error || !summary ? (
                  <td colSpan={5} className="py-2 text-ardoise-400">
                    {error}
                  </td>
                ) : (
                  <>
                    <td className="py-2 text-ardoise-500">{summary.totalPlannedHours.toFixed(1)} h</td>
                    <td className="py-2 text-ardoise-500">{summary.totalWorkedHours.toFixed(1)} h</td>
                    <td className="py-2">
                      {summary.overtimeHours > 0.05 ? (
                        <span className="badge bg-faraday-50 text-faraday-700">
                          {formatHours(summary.overtimeHours)}
                        </span>
                      ) : (
                        <span className="text-ardoise-400">—</span>
                      )}
                    </td>
                    <td className="py-2">
                      {summary.deficitHours > 0.05 ? (
                        <span className="badge bg-amber-50 text-amber-700">
                          -{summary.deficitHours.toFixed(1)} h
                        </span>
                      ) : (
                        <span className="text-ardoise-400">—</span>
                      )}
                    </td>
                    <td className="py-2 font-semibold">
                      <span className={summary.balanceHours < 0 ? "text-amber-700" : "text-faraday-700"}>
                        {formatHours(summary.balanceHours)}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
