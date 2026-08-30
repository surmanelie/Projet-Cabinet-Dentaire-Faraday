import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/StatCard";
import SectionLabel from "@/components/SectionLabel";
import Link from "next/link";
import { getAgendaData } from "@/lib/agenda";
import { computeProgrammedMinutesForMonth } from "@/lib/hours-engine";
import { startOfParisDay, endOfParisDay, getParisYearMonth, CABINET_TIMEZONE } from "@/lib/timezone";

const WEEKS_PER_MONTH = 4.33;

export default async function DashboardPage() {
  const today = new Date();
  const todayStart = startOfParisDay(today);
  const todayEnd = endOfParisDay(today);
  const in30Days = addDays(today, 30);
  const { year, month } = getParisYearMonth(today);

  const [
    activeAssistants,
    activePractitioners,
    presentToday,
    absencesToday,
    upcomingLeaves,
    unvalidatedEntries,
    pendingMonthly,
    assistants,
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
    prisma.user.findMany({
      where: { role: "ASSISTANT", active: true },
      select: { id: true, firstName: true, lastName: true, assistantProfile: { select: { weeklyContractHours: true } } },
      orderBy: { lastName: "asc" },
    }),
  ]);

  // Synthèse compacte : heures prévues (contrat) vs. déjà programmées ce
  // mois pour chaque assistante — pas les heures réellement pointées (ça,
  // c'est le rôle du Suivi des heures / export PDF).
  const hoursSummary = await Promise.all(
    assistants.map(async (a) => {
      const { templatesByDow, entriesByDate } = await getAgendaData(a.id, year, month);
      const programmedHours = computeProgrammedMinutesForMonth(templatesByDow, entriesByDate, year, month) / 60;
      const contractHours = a.assistantProfile?.weeklyContractHours ?? 35;
      const contractMonthlyHours = contractHours * WEEKS_PER_MONTH;
      return {
        id: a.id,
        name: `${a.firstName} ${a.lastName}`,
        contractHours,
        programmedHours,
        remainingHours: contractMonthlyHours - programmedHours,
      };
    })
  );

  return (
    <div className="space-y-10">
      <div>
        <SectionLabel>{today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: CABINET_TIMEZONE })}</SectionLabel>
        <h1 className="mt-3 page-title">Tableau de bord</h1>
      </div>

      {activeAssistants === 0 && (
        <div className="rounded-md border border-faraday-300 bg-faraday-50 p-6">
          <h2 className="section-title text-faraday-800">Bienvenue — configurons votre cabinet</h2>
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

      {hoursSummary.length > 0 && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Heures programmées ce mois</p>
            <Link href="/equipe/heures" className="text-xs font-medium text-faraday-700 hover:underline">
              Suivi détaillé →
            </Link>
          </div>
          <div className="divide-y divide-ardoise-100">
            {hoursSummary.map((h) => (
              <div key={h.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                <span className="font-medium text-ardoise-900">{h.name}</span>
                <div className="flex items-center gap-4 text-xs sm:text-sm">
                  <span className="text-ardoise-400">{h.contractHours} h/sem prévues</span>
                  <span className="text-ardoise-600">{h.programmedHours.toFixed(1)} h programmées</span>
                  <span className={h.remainingHours >= 0 ? "font-medium text-ardoise-500" : "font-medium text-amber-700"}>
                    {h.remainingHours >= 0
                      ? `${h.remainingHours.toFixed(1)} h reste à programmer`
                      : `+${Math.abs(h.remainingHours).toFixed(1)} h supp.`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
