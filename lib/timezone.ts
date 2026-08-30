import { fromZonedTime } from "date-fns-tz";

/**
 * Fuseau horaire de référence du cabinet. Toutes les heures « murales »
 * (pointage, planning, agenda) doivent rester cohérentes avec Europe/Paris
 * quel que soit le fuseau du serveur qui exécute le code — les fonctions
 * Vercel tournent en UTC par défaut, ce qui décale sinon systématiquement
 * les heures affichées (et les frontières « aujourd'hui ») de 1h ou 2h
 * selon l'heure d'été/hiver.
 */
export const CABINET_TIMEZONE = "Europe/Paris";

/**
 * Début (00:00) du jour Paris contenant l'instant `d`, comme instant UTC
 * réellement correct — utilisé pour toutes les requêtes « aujourd'hui » /
 * « ce jour-là » (pointage, WorkEntry), pour ne jamais attribuer un
 * pointage de 00h-2h (heure de Paris) à la mauvaise journée.
 */
export function startOfParisDay(d: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CABINET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return fromZonedTime(`${y}-${m}-${day}T00:00:00`, CABINET_TIMEZONE);
}

/** Fin (23:59:59.999) du jour Paris contenant l'instant `d`. */
export function endOfParisDay(d: Date): Date {
  const nextDayStart = startOfParisDay(new Date(startOfParisDay(d).getTime() + 25 * 60 * 60 * 1000));
  return new Date(nextDayStart.getTime() - 1);
}

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/**
 * Jour de la semaine (0 = dimanche … 6 = samedi, convention `Date.getDay()`)
 * de l'instant `d` tel que vécu à Paris — jamais `d.getDay()` directement,
 * qui lit le jour dans le fuseau du PROCESSUS serveur.
 */
export function getParisDayOfWeek(d: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: CABINET_TIMEZONE, weekday: "short" }).format(d);
  return WEEKDAY_TO_INDEX[weekday];
}

/** Année et mois (1-12) de l'instant `d` tels que vécus à Paris. */
export function getParisYearMonth(d: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CABINET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);
  return {
    year: Number(parts.find((p) => p.type === "year")!.value),
    month: Number(parts.find((p) => p.type === "month")!.value),
  };
}
