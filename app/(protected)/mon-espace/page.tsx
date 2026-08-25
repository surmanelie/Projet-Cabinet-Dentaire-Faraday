import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClockStatus, getTodayClockEntries } from "@/lib/actions/clock";
import { computeMonthlyRecap } from "@/lib/actions/monthly-validation";
import { computeDayMinutes } from "@/lib/hours-engine";
import HoursGauge from "@/components/HoursGauge";
import SectionLabel from "@/components/SectionLabel";
import MonthlyResponse from "./MonthlyResponse";

const STATUS: Record<string, { label: string; dot: string; tone: string }> = {
  ABSENT: { label: "Pas encore pointé", dot: "bg-ardoise-300", tone: "text-ardoise-500" },
  PRESENT: { label: "En poste", dot: "bg-faraday-500", tone: "text-faraday-700" },
  EN_PAUSE: { label: "En pause", dot: "bg-amber-400", tone: "text-amber-700" },
  JOURNEE_TERMINEE: { label: "Journée terminée", dot: "bg-ardoise-400", tone: "text-ardoise-600" },
};

function formatHM(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h${String(mm).padStart(2, "0")}`;
}

/** Minutes travaillées aujourd'hui à partir des pointages (temps réel). */
function workedMinutesToday(entries: { action: string; timestamp: Date }[]): number {
  const sorted = [...entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const start = sorted.find((e) => e.action === "DEBUT_JOURNEE");
  if (!start) return 0;
  const lastEnd = [...sorted].reverse().find((e) => e.action === "FIN_JOURNEE");
  const end = lastEnd ? lastEnd.timestamp : new Date();

  let breakMs = 0;
  let pauseStart: Date | null = null;
  for (const e of sorted) {
    if (e.action === "DEBUT_PAUSE") pauseStart = e.timestamp;
    else if (e.action === "FIN_PAUSE" && pauseStart) {
      breakMs += e.timestamp.getTime() - pauseStart.getTime();
      pauseStart = null;
    }
  }
  if (pauseStart && !lastEnd) breakMs += end.getTime() - pauseStart.getTime();
  return (end.getTime() - start.timestamp.getTime() - breakMs) / 60000;
}

export default async function MonEspacePage() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Début de la semaine (lundi)
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  const [status, todayEntries, weekEntries, monthly] = await Promise.all([
    getClockStatus(session.id),
    getTodayClockEntries(session.id),
    prisma.workEntry.findMany({
      where: { userId: session.id, date: { gte: weekStart, lt: todayStart } },
    }),
    prisma.monthlyValidation.findUnique({
      where: { userId_month_year: { userId: session.id, month: now.getMonth() + 1, year: now.getFullYear() } },
    }),
  ]);

  const todayMin = workedMinutesToday(todayEntries.map((e) => ({ action: e.action, timestamp: e.timestamp })));
  const weekHistMin = weekEntries
    .filter((e) => e.actualStart && e.actualEnd)
    .reduce((sum, e) => sum + computeDayMinutes({ start: e.actualStart!, end: e.actualEnd!, breakMinutes: e.breakMinutes }), 0);
  const weekMin = weekHistMin + todayMin;

  let overtime = 0;
  let deficit = 0;
  let monthWorked = 0;
  let monthTarget = 0;
  try {
    const recap = await computeMonthlyRecap(session.id, now.getMonth() + 1, now.getFullYear());
    overtime = recap.overtimeHours;
    deficit = recap.deficitHours;
    monthWorked = recap.totalWorkedHours;
    monthTarget = recap.totalPlannedHours;
  } catch {
    /* pas encore de données ce mois */
  }

  const s = STATUS[status];
  const arrival = todayEntries.find((e) => e.action === "DEBUT_JOURNEE");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <SectionLabel>{now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</SectionLabel>
        <h1 className="mt-3 font-serif text-4xl italic text-ardoise-900">Bonjour {session.firstName}</h1>
      </div>

      {/* Statut + pointage */}
      <div className="card">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
          <span className={`text-base font-medium ${s.tone}`}>{s.label}</span>
          {arrival && status !== "ABSENT" && (
            <span className="ml-auto text-sm text-ardoise-400">
              depuis {arrival.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <Link href="/pointage" className="btn-primary mt-4 flex w-full items-center justify-center py-4 text-base">
          Pointer maintenant
        </Link>
      </div>

      {/* Mes heures ce mois — jauge visuelle */}
      <div className="card flex flex-col items-center">
        <p className="mb-2 self-start text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Mes heures ce mois</p>
        <HoursGauge worked={monthWorked} target={monthTarget} overtime={overtime} missing={deficit} />
        <div className="mt-4 grid w-full grid-cols-2 gap-3">
          <Tile label="Aujourd'hui" value={formatHM(todayMin)} />
          <Tile label="Cette semaine" value={formatHM(weekMin)} />
        </div>
      </div>

      {/* Actions secondaires */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/absences" className="btn-secondary">Demander des congés</Link>
        <Link href="/mes-horaires" className="btn-secondary">Voir mes horaires</Link>
      </div>

      {/* Validation mensuelle (seulement si une réponse est attendue) */}
      {monthly && monthly.status === "ENVOYE_AU_SALARIE" && (
        <div className="card">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Votre récapitulatif du mois est prêt</p>
          <p className="mb-3 text-sm text-ardoise-500">Merci de vérifier et de valider vos heures du mois.</p>
          <MonthlyResponse validationId={monthly.id} />
        </div>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <p className="font-serif text-xl italic text-ardoise-900">{value}</p>
      <p className="mt-0.5 text-xs text-ardoise-400">{label}</p>
    </div>
  );
}
