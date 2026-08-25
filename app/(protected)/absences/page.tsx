import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminOrRh } from "@/lib/permissions";
import SectionLabel from "@/components/SectionLabel";
import AbsenceForm from "./AbsenceForm";
import ReviewButtons from "./ReviewButtons";

const STATUS_STYLES: Record<string, string> = {
  DEMANDE: "bg-amber-50 text-amber-700",
  ACCEPTE: "bg-faraday-50 text-faraday-700",
  REFUSE: "bg-red-50 text-red-700",
  ANNULE: "bg-ardoise-100 text-ardoise-500",
};

const STATUS_LABELS: Record<string, string> = {
  DEMANDE: "En attente",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  ANNULE: "Annulé",
};

const TYPE_LABELS: Record<string, string> = {
  CONGE_PAYE: "Congé payé",
  ARRET_MALADIE: "Arrêt maladie",
  ABSENCE_EXCEPTIONNELLE: "Absence exceptionnelle",
  ABSENCE_NON_REMUNEREE: "Absence non rémunérée",
  FORMATION: "Formation",
  RECUPERATION: "Récupération",
  AUTRE: "Autre",
};

export default async function AbsencesPage() {
  const session = await getSession();
  if (!session) return null;
  const canReview = isAdminOrRh(session.role);

  const [mine, pending] = await Promise.all([
    prisma.absence.findMany({
      where: { userId: session.id },
      orderBy: { startDate: "desc" },
      take: 20,
    }),
    canReview
      ? prisma.absence.findMany({
          where: { status: "DEMANDE" },
          include: { user: true },
          orderBy: { startDate: "asc" },
        })
      : Promise.resolve([]),
  ]);

  // L'administrateur / RH gère les congés (valide) : il ne fait pas de demande.
  // L'employé fait ses demandes et suit leur statut.
  if (canReview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <SectionLabel>Absences</SectionLabel>
          <h1 className="mt-3 font-serif text-4xl italic text-ardoise-900">Congés à valider</h1>
        </div>
        <div className="card">
          <ul className="space-y-3 text-sm">
            {pending.map((a) => (
              <li key={a.id} className="flex items-center justify-between border-b border-ardoise-100 pb-3 last:border-0">
                <div>
                  <p className="font-medium text-ardoise-900">{a.user.firstName} {a.user.lastName}</p>
                  <p className="text-ardoise-500">
                    {TYPE_LABELS[a.type] ?? a.type} — {a.startDate.toLocaleDateString("fr-FR")} → {a.endDate.toLocaleDateString("fr-FR")}
                  </p>
                  {a.comment && <p className="text-xs text-ardoise-400">« {a.comment} »</p>}
                </div>
                <ReviewButtons absenceId={a.id} />
              </li>
            ))}
            {pending.length === 0 && <p className="py-6 text-center text-ardoise-400">Aucune demande en attente.</p>}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <SectionLabel>Absences</SectionLabel>
        <h1 className="mt-3 font-serif text-4xl italic text-ardoise-900">Mes congés</h1>
      </div>
      <div className="card">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Demander un congé</p>
        <AbsenceForm />
      </div>

      <div className="card">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Mes demandes</p>
        <ul className="space-y-2 text-sm">
          {mine.map((a) => (
            <li key={a.id} className="flex items-center justify-between border-b border-ardoise-100 pb-2 last:border-0">
              <span>
                {TYPE_LABELS[a.type] ?? a.type} — {a.startDate.toLocaleDateString("fr-FR")} → {a.endDate.toLocaleDateString("fr-FR")}
              </span>
              <span className={`badge ${STATUS_STYLES[a.status]}`}>{STATUS_LABELS[a.status] ?? a.status}</span>
            </li>
          ))}
          {mine.length === 0 && <p className="text-ardoise-400">Aucune demande pour le moment.</p>}
        </ul>
      </div>
    </div>
  );
}
