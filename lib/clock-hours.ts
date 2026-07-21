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

function toHHMM(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Transforme les pointages d'UNE journée en heures de début/fin + pauses.
 *
 * Règles de robustesse (des pointages incohérents ne doivent jamais faire
 * planter le calcul) :
 * - `actualStart` = timestamp du premier DEBUT_JOURNEE.
 * - `actualEnd`   = timestamp du dernier FIN_JOURNEE.
 * - Les pauses sont comptées par paires DEBUT_PAUSE → FIN_PAUSE ; une pause
 *   ouverte mais non refermée est ignorée (durée inconnue, non déduite).
 * - Une pause à cheval négatif (fin avant début) est ignorée.
 */
export function deriveDayFromClock(events: ClockEvent[]): DerivedDay {
  const sorted = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const firstStart = sorted.find((e) => e.action === "DEBUT_JOURNEE");
  const lastEnd = [...sorted].reverse().find((e) => e.action === "FIN_JOURNEE");

  let breakMinutes = 0;
  let pauseStart: Date | null = null;
  for (const e of sorted) {
    if (e.action === "DEBUT_PAUSE") {
      pauseStart = e.timestamp;
    } else if (e.action === "FIN_PAUSE" && pauseStart) {
      const diff = (e.timestamp.getTime() - pauseStart.getTime()) / 60000;
      if (diff > 0) breakMinutes += diff;
      pauseStart = null;
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
