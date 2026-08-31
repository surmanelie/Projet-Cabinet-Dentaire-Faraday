/**
 * Moteur de calcul des heures — module pur, sans dépendance à la base de
 * données ni à Next.js, pour rester facilement testable unitairement.
 *
 * Les règles (seuils, majorations) ne sont JAMAIS figées dans le code :
 * elles sont injectées via `RulesConfig`, lui-même chargé depuis
 * CabinetSettings.rulesConfigJson et modifiable depuis /parametres/regles.
 */

export type RulesConfig = {
  /** Seuil hebdomadaire temps plein, en heures (ex: 35). */
  fullTimeWeeklyThreshold: number;
  /** Bornes des heures supplémentaires (temps plein), en heures hebdo. */
  overtimeTier1UpToHours: number; // ex: 43 -> de 35 à 43h
  overtimeTier1Rate: number; // ex: 0.25
  overtimeTier2Rate: number; // ex: 0.50 au-delà de tier1
  /** Heures complémentaires (temps partiel), en % du contrat. */
  partTimeComplementaryTier1Pct: number; // ex: 0.10
  partTimeComplementaryTier1Rate: number; // ex: 0.15
  partTimeComplementaryTier2Rate: number; // ex: 0.25
  /** Arrondi appliqué aux horaires saisis. */
  rounding: "EXACT" | "FIVE_MIN" | "FIFTEEN_MIN";
};

export const DEFAULT_RULES: RulesConfig = {
  fullTimeWeeklyThreshold: 35,
  overtimeTier1UpToHours: 43,
  overtimeTier1Rate: 0.25,
  overtimeTier2Rate: 0.5,
  partTimeComplementaryTier1Pct: 0.10,
  partTimeComplementaryTier1Rate: 0.15,
  partTimeComplementaryTier2Rate: 0.25,
  rounding: "EXACT",
};

export type DayTimes = {
  start: string; // "08:30"
  end: string; // "18:30"
  breakMinutes: number;
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function roundMinutes(minutes: number, rounding: RulesConfig["rounding"]): number {
  if (rounding === "EXACT") return minutes;
  const step = rounding === "FIVE_MIN" ? 5 : 15;
  return Math.round(minutes / step) * step;
}

/** Heures travaillées sur une journée (en minutes), pause déduite. */
export function computeDayMinutes(day: DayTimes, rounding: RulesConfig["rounding"] = "EXACT"): number {
  const start = timeToMinutes(day.start);
  const end = timeToMinutes(day.end);
  const raw = Math.max(0, end - start - day.breakMinutes);
  return roundMinutes(raw, rounding);
}

export type WeeklyBreakdown = {
  workedHours: number;
  contractHours: number;
  deltaHours: number; // positif = surplus, négatif = déficit
  overtimeTier1Hours: number;
  overtimeTier2Hours: number;
  overtimeTier1Pay: number; // en "heures équivalentes" majorées
  overtimeTier2Pay: number;
  complementaryTier1Hours: number;
  complementaryTier2Hours: number;
  complementaryTier1Pay: number;
  complementaryTier2Pay: number;
  deficitHours: number;
};

/**
 * Calcule la répartition hebdomadaire pour un salarié temps plein.
 * - de 0 à contractHours (heures contractuelles RÉELLES du salarié — pas le
 *   seuil légal générique `fullTimeWeeklyThreshold`, qui ne sert que de
 *   valeur par défaut) : heures normales
 * - de contractHours à overtimeTier1UpToHours : majoration tier1
 * - au-delà : majoration tier2
 * Un déficit (< contrat) n'est jamais majoré.
 */
export function computeFullTimeWeek(
  workedHours: number,
  contractHours: number = DEFAULT_RULES.fullTimeWeeklyThreshold,
  rules: RulesConfig = DEFAULT_RULES
): WeeklyBreakdown {
  const deltaHours = workedHours - contractHours;

  let overtimeTier1Hours = 0;
  let overtimeTier2Hours = 0;
  let deficitHours = 0;

  if (deltaHours > 0) {
    const tier1Span = rules.overtimeTier1UpToHours - contractHours;
    overtimeTier1Hours = Math.min(deltaHours, tier1Span);
    overtimeTier2Hours = Math.max(0, deltaHours - tier1Span);
  } else if (deltaHours < 0) {
    deficitHours = Math.abs(deltaHours);
  }

  return {
    workedHours,
    contractHours,
    deltaHours,
    overtimeTier1Hours,
    overtimeTier2Hours,
    overtimeTier1Pay: overtimeTier1Hours * (1 + rules.overtimeTier1Rate),
    overtimeTier2Pay: overtimeTier2Hours * (1 + rules.overtimeTier2Rate),
    complementaryTier1Hours: 0,
    complementaryTier2Hours: 0,
    complementaryTier1Pay: 0,
    complementaryTier2Pay: 0,
    deficitHours,
  };
}

/**
 * Calcule la répartition hebdomadaire pour un salarié temps partiel.
 * Les heures complémentaires sont calculées en % du contrat (et non en
 * heures absolues comme pour le temps plein).
 */
export function computePartTimeWeek(
  workedHours: number,
  contractHours: number,
  rules: RulesConfig = DEFAULT_RULES
): WeeklyBreakdown {
  const deltaHours = workedHours - contractHours;

  let complementaryTier1Hours = 0;
  let complementaryTier2Hours = 0;
  let deficitHours = 0;

  if (deltaHours > 0) {
    const tier1Span = contractHours * rules.partTimeComplementaryTier1Pct;
    complementaryTier1Hours = Math.min(deltaHours, tier1Span);
    complementaryTier2Hours = Math.max(0, deltaHours - tier1Span);
  } else if (deltaHours < 0) {
    deficitHours = Math.abs(deltaHours);
  }

  return {
    workedHours,
    contractHours,
    deltaHours,
    overtimeTier1Hours: 0,
    overtimeTier2Hours: 0,
    overtimeTier1Pay: 0,
    overtimeTier2Pay: 0,
    complementaryTier1Hours,
    complementaryTier2Hours,
    complementaryTier1Pay: complementaryTier1Hours * (1 + rules.partTimeComplementaryTier1Rate),
    complementaryTier2Pay: complementaryTier2Hours * (1 + rules.partTimeComplementaryTier2Rate),
    deficitHours,
  };
}

export type ScheduleTemplateByDow = Record<
  number,
  { startTime: string; endTime: string; breakStart?: string | null; breakEnd?: string | null }
>;
export type PlannedDayOverride = { plannedStart?: string | null; plannedEnd?: string | null };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Durée (en minutes) de la pause déjeuner d'un gabarit de semaine type, si définie. */
function templateBreakMinutes(tpl: ScheduleTemplateByDow[number] | undefined): number {
  if (!tpl?.breakStart || !tpl?.breakEnd) return 0;
  const diff = timeToMinutes(tpl.breakEnd) - timeToMinutes(tpl.breakStart);
  return diff > 0 ? diff : 0;
}

/**
 * Heures « programmées » (planning) d'UN jour — distinctes des heures
 * réellement pointées. L'horaire effectif est celui de l'override
 * `WorkEntry.plannedStart/plannedEnd` s'il existe, sinon celui de la
 * semaine type (`ScheduleTemplate`) du jour de semaine correspondant. La
 * pause déjeuner de la semaine type (`breakStart`/`breakEnd`) est toujours
 * déduite — y compris sur un jour dont l'horaire a été modifié en masse —
 * car c'est une politique par jour de semaine, jamais du temps de travail.
 */
export function computeProgrammedMinutesForDay(
  templatesByDow: ScheduleTemplateByDow,
  override: PlannedDayOverride | undefined,
  dayOfWeek: number,
  rounding: RulesConfig["rounding"] = "EXACT"
): number {
  const tpl = templatesByDow[dayOfWeek];
  const start = override?.plannedStart ?? tpl?.startTime ?? null;
  const end = override?.plannedEnd ?? tpl?.endTime ?? null;
  if (!start || !end) return 0;
  return computeDayMinutes({ start, end, breakMinutes: templateBreakMinutes(tpl) }, rounding);
}

/**
 * Somme des heures programmées sur un mois entier — utilisée à la fois
 * côté serveur (total initial affiché) et côté client (simulation en
 * direct pendant une sélection/édition en masse, avant validation).
 */
export function computeProgrammedMinutesForMonth(
  templatesByDow: ScheduleTemplateByDow,
  entriesByDate: Record<string, PlannedDayOverride>,
  year: number,
  month: number,
  rounding: RulesConfig["rounding"] = "EXACT"
): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let total = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    const key = `${year}-${pad2(month)}-${pad2(d)}`;
    total += computeProgrammedMinutesForDay(templatesByDow, entriesByDate[key], dayOfWeek, rounding);
  }
  return total;
}

export type MonthlySummaryInput = {
  contractType: "TEMPS_PLEIN" | "TEMPS_PARTIEL" | "AUTRE";
  weeklyContractHours: number;
  workedMinutesByDay: number[]; // une entrée par jour travaillé du mois
  absenceHours: number;
  /** Heures de formation (comptées au contrat, jamais pointées — distinctes des heures travaillées). */
  formationHours: number;
  adjustmentMinutes: number; // positif ou négatif, ajustements manuels (non majorés)
  rules?: RulesConfig;
};

export type MonthlySummary = {
  totalPlannedHours: number;
  totalWorkedHours: number;
  totalAbsenceHours: number;
  /** Heures de formation — jamais confondues avec `totalWorkedHours` (temps réellement pointé au cabinet). */
  totalFormationHours: number;
  totalAdjustmentHours: number;
  overtimeHours: number;
  deficitHours: number;
  balanceHours: number; // solde final (peut être négatif)
};

/**
 * Agrège un mois complet à partir des jours travaillés. Simplification
 * pédagogique mais réaliste : on convertit le total mensuel en équivalent
 * hebdomadaire moyen (sur ~4.33 semaines) pour appliquer les règles de
 * majoration, ce qui reste cohérent avec une vue mensuelle de synthèse —
 * la vue hebdomadaire détaillée (computeFullTimeWeek / computePartTimeWeek)
 * doit être utilisée pour le calcul semaine par semaine en paie réelle.
 */
export function computeMonthlySummary(input: MonthlySummaryInput): MonthlySummary {
  const rules = input.rules ?? DEFAULT_RULES;
  const totalWorkedHours =
    input.workedMinutesByDay.reduce((a, b) => a + b, 0) / 60;
  const weeksInMonth = 4.33;
  const contractHoursForMonth = input.weeklyContractHours * weeksInMonth;

  // Les heures de formation comptent au contrat (comme une absence) mais ne
  // sont jamais pointées : on les ajoute au temps "effectif" pour le calcul
  // des heures sup./du déficit, sans jamais les fusionner avec le temps
  // réellement travaillé au cabinet (`totalWorkedHours` reste inchangé).
  const effectiveHours = totalWorkedHours + input.formationHours;

  const weekly =
    input.contractType === "TEMPS_PARTIEL"
      ? computePartTimeWeek(effectiveHours / weeksInMonth, input.weeklyContractHours, rules)
      : computeFullTimeWeek(effectiveHours / weeksInMonth, input.weeklyContractHours, rules);

  const overtimeHoursMonthly =
    (weekly.overtimeTier1Hours + weekly.overtimeTier2Hours + weekly.complementaryTier1Hours + weekly.complementaryTier2Hours) *
    weeksInMonth;
  const deficitHoursMonthly = weekly.deficitHours * weeksInMonth;

  const adjustmentHours = input.adjustmentMinutes / 60;

  return {
    totalPlannedHours: contractHoursForMonth,
    totalWorkedHours,
    totalAbsenceHours: input.absenceHours,
    totalFormationHours: input.formationHours,
    totalAdjustmentHours: adjustmentHours,
    overtimeHours: overtimeHoursMonthly,
    deficitHours: deficitHoursMonthly,
    balanceHours:
      effectiveHours + input.absenceHours + adjustmentHours - contractHoursForMonth,
  };
}
