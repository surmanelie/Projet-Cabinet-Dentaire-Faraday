import Link from "next/link";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export type DayTemplate = { startTime: string; endTime: string };
export type DayEntry = { source: string; actualStart: string | null; actualEnd: string | null; comment: string | null };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Agenda mensuel en grand : une case par jour, avec l'horaire prévu (semaine
 * type), les congés, et les heures réellement pointées. Navigation mois par
 * mois. Composant d'affichage pur.
 */
export default function MonthAgenda({
  year,
  month,
  todayKey,
  templatesByDow,
  entriesByDate,
  prevHref,
  nextHref,
}: {
  year: number;
  month: number;
  todayKey: string;
  templatesByDow: Record<number, DayTemplate>;
  entriesByDate: Record<string, DayEntry>;
  prevHref: string;
  nextHref: string;
}) {
  const firstDay = new Date(year, month - 1, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <Link href={prevHref} className="btn-secondary px-3 py-1.5 text-sm" aria-label="Mois précédent">←</Link>
        <h2 className="font-serif text-xl italic text-ardoise-900">{MONTHS[month - 1]} {year}</h2>
        <Link href={nextHref} className="btn-secondary px-3 py-1.5 text-sm" aria-label="Mois suivant">→</Link>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-center text-xs font-medium uppercase tracking-wide text-ardoise-400">
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} className="min-h-[68px] rounded-xl bg-transparent" />;

          const dow = new Date(year, month - 1, day).getDay();
          const key = `${year}-${pad(month)}-${pad(day)}`;
          const entry = entriesByDate[key];
          const tpl = templatesByDow[dow];
          const isToday = key === todayKey;
          const isAbsence = entry?.source === "absence";

          return (
            <div
              key={key}
              className={`min-h-[68px] rounded-xl border p-1.5 sm:p-2 ${
                isToday ? "border-faraday-500 bg-faraday-50" : "border-ardoise-100 bg-white"
              }`}
            >
              <div className={`text-xs font-medium ${isToday ? "text-faraday-700" : "text-ardoise-500"}`}>{day}</div>

              {isAbsence ? (
                <div className="mt-1 rounded-md bg-amber-50 px-1.5 py-1 text-center text-[11px] font-medium text-amber-700">
                  {entry?.comment ?? "Congé"}
                </div>
              ) : tpl ? (
                <div className="mt-1 rounded-md bg-faraday-50 px-1.5 py-1 text-center text-[11px] font-medium text-faraday-700">
                  {tpl.startTime}–{tpl.endTime}
                </div>
              ) : (
                <div className="mt-1 text-center text-[11px] text-ardoise-300">repos</div>
              )}

              {entry?.actualStart && entry?.actualEnd && !isAbsence && (
                <div className="mt-0.5 text-center text-[10px] text-ardoise-400">
                  réel {entry.actualStart}–{entry.actualEnd}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-ardoise-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-faraday-50 ring-1 ring-faraday-200" /> Horaire prévu</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-amber-50 ring-1 ring-amber-200" /> Congé</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded border border-faraday-500 bg-faraday-50" /> Aujourd&apos;hui</span>
      </div>
    </div>
  );
}
