import { subDays } from "date-fns";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_STYLES: Record<string, string> = {
  PRE_REMPLI: "bg-ardoise-100 text-ardoise-700",
  CONFIRME: "bg-faraday-50 text-faraday-700",
  MODIFIE: "bg-amber-50 text-amber-700",
  A_VALIDER: "bg-amber-50 text-amber-700",
  VALIDE: "bg-faraday-100 text-faraday-800",
  REFUSE: "bg-red-50 text-red-700",
  CORRIGE: "bg-ardoise-100 text-ardoise-700",
  VERROUILLE: "bg-ardoise-200 text-ardoise-700",
};

export default async function MesHorairesPage() {
  const session = await getSession();
  if (!session) return null;

  const entries = await prisma.workEntry.findMany({
    where: { userId: session.id, date: { gte: subDays(new Date(), 30) } },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ardoise-900">Mes horaires — 30 derniers jours</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ardoise-400">
              <th className="py-2">Date</th>
              <th className="py-2">Prévu</th>
              <th className="py-2">Réalisé</th>
              <th className="py-2">Pause</th>
              <th className="py-2">Statut</th>
              <th className="py-2">Commentaire</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-ardoise-100">
                <td className="py-2">{e.date.toLocaleDateString("fr-FR")}</td>
                <td className="py-2">{e.plannedStart ? `${e.plannedStart}–${e.plannedEnd}` : "—"}</td>
                <td className="py-2">{e.actualStart ? `${e.actualStart}–${e.actualEnd}` : "—"}</td>
                <td className="py-2">{e.breakMinutes} min</td>
                <td className="py-2">
                  <span className={`badge ${STATUS_STYLES[e.status]}`}>{e.status}</span>
                </td>
                <td className="py-2 text-ardoise-500">{e.comment ?? "—"}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ardoise-400">
                  Aucune entrée enregistrée sur cette période.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
