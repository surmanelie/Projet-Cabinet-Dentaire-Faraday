import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const STATUS_STYLES: Record<string, string> = {
  DEMANDE: "bg-amber-50 text-amber-700",
  ACCEPTE: "bg-faraday-50 text-faraday-700",
  REFUSE: "bg-red-50 text-red-700",
  ANNULE: "bg-ardoise-100 text-ardoise-500",
};

const ABSENCE_LABELS: Record<string, string> = {
  CONGE_PAYE: "Congé payé",
  ARRET_MALADIE: "Arrêt maladie",
  ABSENCE_EXCEPTIONNELLE: "Absence exceptionnelle",
  ABSENCE_NON_REMUNEREE: "Absence non rémunérée",
  FORMATION: "Formation",
  RECUPERATION: "Récupération",
  AUTRE: "Autre",
};

export default async function EspacePraticienPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const assignments = await prisma.assistantPractitionerAssignment.findMany({
    where: { practitionerId: session.id, active: true },
    include: { assistant: true },
  });

  const assistantIds = assignments.map((a) => a.assistantId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const [myEntries, teamAbsences] = await Promise.all([
    prisma.workEntry.findMany({
      where: { userId: session.id, date: { gte: today, lte: weekFromNow } },
      orderBy: { date: "asc" },
    }),
    assistantIds.length > 0
      ? prisma.absence.findMany({
          where: { userId: { in: assistantIds }, status: { in: ["DEMANDE", "ACCEPTE"] } },
          include: { user: true },
          orderBy: { startDate: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ardoise-900">Mon espace praticien</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Mon planning (7 prochains jours)</h2>
          {myEntries.length === 0 ? (
            <p className="text-sm text-ardoise-400">Aucune entrée planifiée.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {myEntries.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-ardoise-100 pb-1">
                  <span>{new Date(e.date).toLocaleDateString("fr-FR")}</span>
                  <span className="text-ardoise-500">
                    {e.plannedStart ?? "—"} - {e.plannedEnd ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Mes assistantes</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-ardoise-400">Aucune assistante assignée.</p>
          ) : (
            <ul className="space-y-1 text-sm text-ardoise-700">
              {assignments.map((a) => (
                <li key={a.id}>
                  {a.assistant.firstName} {a.assistant.lastName}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Absences de mon équipe</h2>
          {teamAbsences.length === 0 ? (
            <p className="text-sm text-ardoise-400">Aucune absence en cours ou à venir.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {teamAbsences.map((ab) => (
                <li key={ab.id} className="flex items-center justify-between border-b border-ardoise-100 pb-1">
                  <span>
                    {ab.user.firstName} {ab.user.lastName} — {ABSENCE_LABELS[ab.type]} (
                    {new Date(ab.startDate).toLocaleDateString("fr-FR")} →{" "}
                    {new Date(ab.endDate).toLocaleDateString("fr-FR")})
                  </span>
                  <span className={`badge ${STATUS_STYLES[ab.status]}`}>{ab.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
