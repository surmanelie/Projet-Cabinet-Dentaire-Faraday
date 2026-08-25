import { startOfDay, endOfDay, addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/StatCard";
import SectionLabel from "@/components/SectionLabel";
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
    <div className="space-y-10">
      <div>
        <SectionLabel>{today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</SectionLabel>
        <h1 className="mt-3 font-serif text-4xl italic text-ardoise-900">Tableau de bord</h1>
      </div>

      {activeAssistants === 0 && (
        <div className="rounded-md border border-faraday-300 bg-faraday-50 p-6">
          <h2 className="font-serif text-xl italic text-faraday-800">Bienvenue — configurons votre cabinet</h2>
          <ol className="mt-4 space-y-1.5 text-sm text-faraday-800">
            <li>1. Ajoutez un employé (nom, identifiant, mot de passe).</li>
            <li>2. Donnez-lui un code de pointage à 4 chiffres.</li>
            <li>3. Affichez ou imprimez les QR codes pour le pointage.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
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
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Accès rapide</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/planning" className="btn-secondary">Planning</Link>
            <Link href="/equipe" className="btn-secondary">Gérer l&apos;équipe</Link>
            <Link href="/absences" className="btn-secondary">Absences</Link>
            <Link href="/validations/mensuelles" className="btn-secondary">Validations mensuelles</Link>
            <Link href="/rapports" className="btn-secondary">Exports</Link>
          </div>
        </div>
        <div className="card">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Anomalies à surveiller</p>
          <p className="text-sm text-ardoise-600">
            {unvalidatedEntries > 0
              ? `${unvalidatedEntries} journée(s) en attente de validation.`
              : "Aucune anomalie détectée pour le moment."}
          </p>
        </div>
      </div>
    </div>
  );
}
