import { startOfDay, endOfDay, addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/StatCard";
import Link from "next/link";

export default async function DashboardPage() {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const in30Days = addDays(today, 30);

  const [
    activeAssistants,
    activePractitioners,
    presentToday,
    absencesToday,
    upcomingLeaves,
    unvalidatedEntries,
    pendingMonthly,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "ASSISTANT", active: true } }),
    prisma.user.count({ where: { role: "PRATICIEN", active: true } }),
    prisma.workEntry.count({
      where: { date: { gte: todayStart, lte: todayEnd }, status: { in: ["CONFIRME", "VALIDE", "PRE_REMPLI"] } },
    }),
    prisma.absence.count({
      where: { status: "ACCEPTE", startDate: { lte: todayEnd }, endDate: { gte: todayStart } },
    }),
    prisma.absence.count({
      where: { status: { in: ["DEMANDE", "ACCEPTE"] }, startDate: { gte: todayStart, lte: in30Days } },
    }),
    prisma.workEntry.count({ where: { status: { in: ["A_VALIDER", "MODIFIE"] } } }),
    prisma.monthlyValidation.count({ where: { status: { in: ["EN_PREPARATION", "ENVOYE_AU_SALARIE", "REFUSE_SALARIE"] } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ardoise-900">Tableau de bord</h1>
        <p className="text-sm text-ardoise-500">Vue d'ensemble du cabinet — {today.toLocaleDateString("fr-FR")}</p>
      </div>

      {activeAssistants === 0 && (
        <div className="rounded-2xl border border-faraday-200 bg-faraday-50 p-5">
          <h2 className="text-base font-medium text-faraday-800">Bienvenue — configurons votre cabinet</h2>
          <ol className="mt-3 space-y-1.5 text-sm text-faraday-800">
            <li>1. Ajoutez un employé (nom, identifiant, mot de passe).</li>
            <li>2. Donnez-lui un code de pointage à 4 chiffres.</li>
            <li>3. Affichez ou imprimez les QR codes pour le pointage.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/equipe" className="btn-primary">Ajouter un employé</Link>
            <Link href="/equipe/pointage" className="btn-secondary">Voir les QR codes</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Employés actifs" value={activeAssistants} />
        <StatCard label="Praticiens actifs" value={activePractitioners} />
        <StatCard label="Présents aujourd'hui" value={presentToday} tone="success" />
        <StatCard label="Absences aujourd'hui" value={absencesToday} tone={absencesToday > 0 ? "warning" : "default"} />
        <StatCard label="Congés à venir (30j)" value={upcomingLeaves} />
        <StatCard label="Heures non validées" value={unvalidatedEntries} tone={unvalidatedEntries > 0 ? "warning" : "default"} />
        <StatCard label="Validations mensuelles en attente" value={pendingMonthly} tone={pendingMonthly > 0 ? "danger" : "default"} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Accès rapide</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/planning" className="btn-secondary">Planning</Link>
            <Link href="/equipe" className="btn-secondary">Gérer l'équipe</Link>
            <Link href="/absences" className="btn-secondary">Absences</Link>
            <Link href="/validations/mensuelles" className="btn-secondary">Validations mensuelles</Link>
            <Link href="/rapports" className="btn-secondary">Exports</Link>
          </div>
        </div>
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Anomalies à surveiller</h2>
          <p className="text-sm text-ardoise-500">
            {unvalidatedEntries > 0
              ? `${unvalidatedEntries} journée(s) en attente de validation.`
              : "Aucune anomalie détectée pour le moment."}
          </p>
        </div>
      </div>
    </div>
  );
}
