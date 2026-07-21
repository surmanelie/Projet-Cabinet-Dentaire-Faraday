import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateTodayEntry, confirmTodayAction } from "@/lib/actions/work-entries";
import EditDayForm from "./EditDayForm";
import MonthlyResponse from "./MonthlyResponse";

const STATUS_LABELS: Record<string, string> = {
  PRE_REMPLI: "Pré-rempli",
  CONFIRME: "Confirmé",
  MODIFIE: "Modifié",
  A_VALIDER: "À valider",
  VALIDE: "Validé",
  REFUSE: "Refusé",
  CORRIGE: "Corrigé par RH",
  VERROUILLE: "Verrouillé",
};

export default async function MonEspacePage() {
  const session = await getSession();
  if (!session) return null;

  const entry = await getOrCreateTodayEntry(session.id);
  const now = new Date();
  const monthly = await prisma.monthlyValidation.findUnique({
    where: { userId_month_year: { userId: session.id, month: now.getMonth() + 1, year: now.getFullYear() } },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ardoise-900">Bonjour {session.firstName} 👋</h1>
        <p className="text-sm text-ardoise-500">{now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-ardoise-900">Horaires prévus aujourd'hui</h2>
        {entry.plannedStart ? (
          <p className="text-2xl font-semibold text-faraday-700">
            {entry.plannedStart} – {entry.plannedEnd}
          </p>
        ) : (
          <p className="text-sm text-ardoise-500">Aucun horaire type défini pour aujourd'hui — contactez le RH.</p>
        )}
        <p className="mt-2 text-xs text-ardoise-400">
          Statut : <span className="badge bg-ardoise-100 text-ardoise-700">{STATUS_LABELS[entry.status]}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <form action={confirmTodayAction}>
            <button type="submit" className="btn-primary">Je confirme mes horaires</button>
          </form>
          <a href="/absences" className="btn-secondary">Déclarer une absence</a>
          <a href="/absences" className="btn-secondary">Demander un congé</a>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Modifier mes horaires du jour</h2>
        <EditDayForm
          defaultStart={entry.actualStart ?? entry.plannedStart ?? ""}
          defaultEnd={entry.actualEnd ?? entry.plannedEnd ?? ""}
          defaultBreak={entry.breakMinutes}
          locked={entry.locked}
        />
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-ardoise-900">Récapitulatif du mois</h2>
        <p className="text-sm text-ardoise-500">
          Statut de validation mensuelle :{" "}
          <span className="badge bg-faraday-50 text-faraday-700">
            {monthly?.status ?? "Pas encore généré"}
          </span>
        </p>
        {monthly && monthly.status === "ENVOYE_AU_SALARIE" && <MonthlyResponse validationId={monthly.id} />}
        <a href="/validations/mensuelles" className="mt-2 inline-block text-sm text-faraday-600 hover:underline">
          Voir le détail →
        </a>
      </div>
    </div>
  );
}
