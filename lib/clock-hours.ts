/**
 * Dérivation des heures travaillées à partir des pointages QR (ClockEntry).
 *
 * Module PUR (aucune dépendance Prisma / Next.js) pour rester testable :
 * il transforme la suite d'événements de pointage d'une journée en heures
 * de début / fin réelles et en minutes de pause, réutilisables par le moteur
 * de calcul existant (hours-engine) via la table WorkEntry.
 */

export type ClockEvent = {
  action: "DEBUT_JOURNEE" | "DEBUT_PAUSE" | "FIN_PAUSE" | "FIN_JOURNEE";
  timestamp: Date;
};

export type ClockStatus =
  | "ABSENT"         // pas encore pointé aujourd'hui
  | "PRESENT"        // début journée enregistré, pas en pause
  | "EN_PAUSE"       // pause en cours
  | "JOURNEE_TERMINEE"; // fin journée enregistrée

/**
 * Actions de pointage autorisées selon l'état courant — un seul QR ou une
 * seule page /pointage, la ou les bonnes options. Défini ici (module pur,
 * sans "use server") car un fichier Server Actions ne peut exporter que
 * des fonctions async, jamais une constante.
 */
export const ALLOWED_BY_STATUS: Record<ClockStatus, ClockEvent["action"][]> = {
  ABSENT: ["DEBUT_JOURNEE"],
  PRESENT: ["DEBUT_PAUSE", "FIN_JOURNEE"],
  EN_PAUSE: ["FIN_PAUSE"],
  // Une journée "terminée" peut toujours redémarrer : une même journée peut
  // contenir plusieurs sessions de travail (ex: erreur de pointage, coupure
  // méridienne pointée comme fin/reprise plutôt que pause). Voir
  // deriveDayFromClock ci-dessous pour le calcul du temps travaillé qui en
  // tient compte.
  JOURNEE_TERMINEE: ["DEBUT_JOURNEE"],
};

export type DerivedDay = {
  /** "HH:MM" — premier début de journée du jour, ou null si aucun. */
  actualStart: string | null;
  /** "HH:MM" — dernière fin de journée du jour, ou null si journée non terminée. */
  actualEnd: string | null;
  /** Total des pauses de la journée, en minutes (arrondi). */
  breakMinutes: number;
  /** true si la journée a un début ET une fin exploitables pour le calcul. */
  complete: boolean;
};

/**
 * "HH:MM" en heure de Paris — jamais via les accesseurs locaux de Date
 * (`getHours`/`getMinutes`), qui dépendent du fuseau du PROCESSUS serveur
 * (UTC par défaut sur Vercel) et décalaient les heures stockées de 1-2h par
 * rapport à l'heure réelle du cabinet.
 */
function toHHMM(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Transforme les pointages d'UNE journée en heures de début/fin + pauses.
 *
 * Une journée peut contenir plusieurs sessions de travail (ex: 08:30→12:30
 * puis 13:30→18:00, ou une fin de journée pointée par erreur suivie d'une
 * reprise). `actualStart`/`actualEnd` restent le premier début et le
 * dernier fin de la journée ; tout ce qui se passe ENTRE deux sessions
 * (FIN_JOURNEE → DEBUT_JOURNEE suivant) est exclu du temps travaillé
 * exactement comme une pause (DEBUT_PAUSE → FIN_PAUSE) — les deux types de
 * coupure sont donc traités par la même logique de paires.
 *
 * Règles de robustesse (des pointages incohérents ne doivent jamais faire
 * planter le calcul) :
 * - `actualStart` = timestamp du premier DEBUT_JOURNEE.
 * - `actualEnd`   = timestamp du dernier FIN_JOURNEE.
 * - Les coupures (pauses ET écarts inter-sessions) sont comptées par paires
 *   "début de coupure" → "fin de coupure" ; une coupure ouverte mais non
 *   refermée est ignorée (durée inconnue, non déduite) — c'est le cas
 *   normal de la coupure finale après le dernier FIN_JOURNEE.
 * - Une coupure à cheval négatif (fin avant début) est ignorée.
 */
export function deriveDayFromClock(events: ClockEvent[]): DerivedDay {
  const sorted = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const firstStart = sorted.find((e) => e.action === "DEBUT_JOURNEE");
  const lastEnd = [...sorted].reverse().find((e) => e.action === "FIN_JOURNEE");

  let breakMinutes = 0;
  let gapStart: Date | null = null;
  for (const e of sorted) {
    if (e.action === "DEBUT_PAUSE" || e.action === "FIN_JOURNEE") {
      gapStart = e.timestamp;
    } else if ((e.action === "FIN_PAUSE" || e.action === "DEBUT_JOURNEE") && gapStart) {
      const diff = (e.timestamp.getTime() - gapStart.getTime()) / 60000;
      if (diff > 0) breakMinutes += diff;
      gapStart = null;
    }
  }

  const actualStart = firstStart ? toHHMM(firstStart.timestamp) : null;
  const actualEnd = lastEnd ? toHHMM(lastEnd.timestamp) : null;

  return {
    actualStart,
    actualEnd,
    breakMinutes: Math.round(breakMinutes),
    complete: Boolean(actualStart && actualEnd),
  };
}
