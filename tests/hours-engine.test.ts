import { describe, it, expect } from "vitest";
import {
  computeDayMinutes,
  computeFullTimeWeek,
  computePartTimeWeek,
  computeMonthlySummary,
  computeProgrammedMinutesForDay,
  computeProgrammedMinutesForMonth,
  roundMinutes,
  DEFAULT_RULES,
} from "@/lib/hours-engine";

describe("computeDayMinutes", () => {
  it("calcule une journée simple avec pause déjeuner", () => {
    const minutes = computeDayMinutes({ start: "08:30", end: "18:30", breakMinutes: 60 });
    expect(minutes).toBe(9 * 60); // 10h de présence - 1h de pause = 9h
  });

  it("applique l'arrondi au quart d'heure", () => {
    const minutes = computeDayMinutes(
      { start: "08:32", end: "12:07", breakMinutes: 0 },
      "FIFTEEN_MIN"
    );
    expect(minutes % 15).toBe(0);
  });
});

describe("roundMinutes", () => {
  it("ne change rien en mode EXACT", () => {
    expect(roundMinutes(127, "EXACT")).toBe(127);
  });
  it("arrondit à 5 minutes", () => {
    expect(roundMinutes(127, "FIVE_MIN")).toBe(125);
  });
});

describe("computeFullTimeWeek — semaine normale", () => {
  it("ne génère aucune heure supplémentaire à 35h", () => {
    const r = computeFullTimeWeek(35);
    expect(r.overtimeTier1Hours).toBe(0);
    expect(r.overtimeTier2Hours).toBe(0);
    expect(r.deficitHours).toBe(0);
  });
});

describe("computeFullTimeWeek — heures supplémentaires", () => {
  it("majore à 25% de la 36e à la 43e heure", () => {
    const r = computeFullTimeWeek(40, 35, DEFAULT_RULES);
    expect(r.overtimeTier1Hours).toBe(5);
    expect(r.overtimeTier2Hours).toBe(0);
    expect(r.overtimeTier1Pay).toBeCloseTo(5 * 1.25);
  });

  it("majore à 50% au-delà de la 43e heure", () => {
    const r = computeFullTimeWeek(45, 35, DEFAULT_RULES);
    expect(r.overtimeTier1Hours).toBe(8); // 35 -> 43
    expect(r.overtimeTier2Hours).toBe(2); // 43 -> 45
    expect(r.overtimeTier2Pay).toBeCloseTo(2 * 1.5);
  });
});

describe("computePartTimeWeek — temps partiel", () => {
  it("majore à 15% jusqu'à 10% du contrat", () => {
    // contrat 20h, +10% = 2h en tier1
    const r = computePartTimeWeek(22, 20, DEFAULT_RULES);
    expect(r.complementaryTier1Hours).toBeCloseTo(2);
    expect(r.complementaryTier2Hours).toBeCloseTo(0);
  });

  it("majore à 25% au-delà de 10% du contrat", () => {
    const r = computePartTimeWeek(24, 20, DEFAULT_RULES);
    expect(r.complementaryTier1Hours).toBeCloseTo(2);
    expect(r.complementaryTier2Hours).toBeCloseTo(2);
    expect(r.complementaryTier2Pay).toBeCloseTo(2 * 1.25);
  });
});

describe("déficit d'heures", () => {
  it("un déficit n'est jamais majoré", () => {
    const r = computeFullTimeWeek(30, 35, DEFAULT_RULES);
    expect(r.deficitHours).toBe(5);
    expect(r.overtimeTier1Pay).toBe(0);
    expect(r.overtimeTier2Pay).toBe(0);
  });

  it("le déficit se calcule contre les heures contractuelles réelles, pas le seuil générique de 35h", () => {
    // Régression : un contrat à 10h/semaine qui n'a rien travaillé ne doit
    // jamais afficher un déficit de 35h (bug constaté dans l'export CSV comptable).
    const r = computeFullTimeWeek(0, 10, DEFAULT_RULES);
    expect(r.deficitHours).toBe(10);
  });
});

describe("computeMonthlySummary", () => {
  it("calcule un mois normal sans heures sup ni absence", () => {
    const workedMinutesByDay = Array(20).fill(7 * 60); // 20 jours à 7h = 140h
    const summary = computeMonthlySummary({
      contractType: "TEMPS_PLEIN",
      weeklyContractHours: 35,
      workedMinutesByDay,
      absenceHours: 0,
      formationHours: 0,
      adjustmentMinutes: 0,
    });
    expect(summary.totalWorkedHours).toBeCloseTo(140);
    expect(summary.balanceHours).toBeCloseTo(140 - 35 * 4.33, 1);
  });

  it("prend en compte une absence dans le solde", () => {
    const workedMinutesByDay = Array(15).fill(7 * 60);
    const summary = computeMonthlySummary({
      contractType: "TEMPS_PLEIN",
      weeklyContractHours: 35,
      workedMinutesByDay,
      absenceHours: 35, // une semaine de congé payé comptée comme travaillée
      formationHours: 0,
      adjustmentMinutes: 0,
    });
    expect(summary.totalAbsenceHours).toBe(35);
  });

  it("temps partiel : applique les règles complémentaires", () => {
    const workedMinutesByDay = Array(20).fill(5 * 60); // 100h sur le mois, contrat 20h/sem
    const summary = computeMonthlySummary({
      contractType: "TEMPS_PARTIEL",
      weeklyContractHours: 20,
      workedMinutesByDay,
      absenceHours: 0,
      formationHours: 0,
      adjustmentMinutes: 0,
    });
    expect(summary.totalPlannedHours).toBeCloseTo(20 * 4.33);
  });

  it("un ajustement négatif après paiement d'heures réduit le solde sans majoration", () => {
    const workedMinutesByDay = Array(20).fill(7 * 60);
    const summary = computeMonthlySummary({
      contractType: "TEMPS_PLEIN",
      weeklyContractHours: 35,
      workedMinutesByDay,
      absenceHours: 0,
      formationHours: 0,
      adjustmentMinutes: -120, // -2h, ex: trop payé le mois précédent
    });
    expect(summary.totalAdjustmentHours).toBe(-2);
  });

  it("le déficit mensuel reste cohérent avec le solde pour un petit contrat (régression export CSV)", () => {
    // Un salarié à 10h/semaine (contractType AUTRE) n'ayant rien pointé ce
    // mois-ci : le déficit doit correspondre à SON contrat (~43h/mois),
    // pas au seuil temps plein générique (35h/sem ≈ 151h/mois).
    const summary = computeMonthlySummary({
      contractType: "AUTRE",
      weeklyContractHours: 10,
      workedMinutesByDay: [],
      absenceHours: 0,
      formationHours: 0,
      adjustmentMinutes: 0,
    });
    expect(summary.deficitHours).toBeCloseTo(summary.totalPlannedHours, 1);
    expect(summary.deficitHours).toBeCloseTo(-summary.balanceHours, 1);
  });
});

describe("6 cas obligatoires — heures programmées (planning) vs contrat vs pointage réel", () => {
  const YEAR = 2026;
  const MONTH = 1; // janvier 2026

  it("cas 1 — planning inférieur au contrat : il reste des heures à programmer", () => {
    const weekdaysTemplate = {
      1: { startTime: "09:00", endTime: "13:00" }, // 4h/jour, lundi à vendredi
      2: { startTime: "09:00", endTime: "13:00" },
      3: { startTime: "09:00", endTime: "13:00" },
      4: { startTime: "09:00", endTime: "13:00" },
      5: { startTime: "09:00", endTime: "13:00" },
    };
    const programmedMinutes = computeProgrammedMinutesForMonth(weekdaysTemplate, {}, YEAR, MONTH);
    const contractMonthlyMinutes = 35 * 4.33 * 60; // contrat 35h/semaine
    expect(programmedMinutes).toBeLessThan(contractMonthlyMinutes);
  });

  it("cas 2 — planning égal au contrat du jour : reste à programmer nul", () => {
    const programmedMinutes = computeProgrammedMinutesForDay({}, { plannedStart: "09:00", plannedEnd: "17:00" }, 1);
    const contractDayMinutes = 8 * 60;
    expect(programmedMinutes).toBe(contractDayMinutes);
    expect(programmedMinutes - contractDayMinutes).toBe(0);
  });

  it("cas 3 — planning supérieur au contrat du jour : heures supplémentaires programmées", () => {
    const programmedMinutes = computeProgrammedMinutesForDay({}, { plannedStart: "08:00", plannedEnd: "18:00" }, 1);
    const contractDayMinutes = 8 * 60;
    expect(programmedMinutes - contractDayMinutes).toBe(120); // +2h supp. programmées
  });

  it("cas 4 — ajout d'heures sur plusieurs jours à la fois : le total augmente exactement de la somme ajoutée", () => {
    const before = computeProgrammedMinutesForMonth({}, {}, YEAR, MONTH);
    const entriesAfter = {
      "2026-01-05": { plannedStart: "09:00", plannedEnd: "17:00" }, // +8h
      "2026-01-06": { plannedStart: "09:00", plannedEnd: "17:00" }, // +8h
      "2026-01-07": { plannedStart: "09:00", plannedEnd: "13:00" }, // +4h
    };
    const after = computeProgrammedMinutesForMonth({}, entriesAfter, YEAR, MONTH);
    expect(before).toBe(0);
    expect(after - before).toBe((8 + 8 + 4) * 60);
  });

  it("cas 5 — retrait d'heures sur un jour déjà programmé : le total diminue exactement de la durée retirée", () => {
    const entriesBefore = {
      "2026-01-05": { plannedStart: "09:00", plannedEnd: "17:00" }, // 8h
      "2026-01-06": { plannedStart: "09:00", plannedEnd: "17:00" }, // 8h
    };
    const before = computeProgrammedMinutesForMonth({}, entriesBefore, YEAR, MONTH);

    const entriesAfter = {
      "2026-01-05": { plannedStart: "09:00", plannedEnd: "17:00" },
      "2026-01-06": { plannedStart: null, plannedEnd: null }, // jour retiré du planning
    };
    const after = computeProgrammedMinutesForMonth({}, entriesAfter, YEAR, MONTH);

    expect(before).toBe(16 * 60);
    expect(after).toBe(8 * 60);
    expect(before - after).toBe(8 * 60);
  });

  it("cas 6 — écart planning vs pointage réel : les deux écarts restent distincts, jamais fusionnés", () => {
    // Contrat 35h/semaine. Le planning programme 38h (+3h). Le pointage réel
    // n'enregistre que 36h effectivement travaillées (+1h). Les deux
    // dépassements doivent rester deux nombres séparés, jamais confondus
    // l'un avec l'autre ni avec un seul total générique.
    const contractWeekHours = 35;

    const programmed = computeFullTimeWeek(38, contractWeekHours, DEFAULT_RULES);
    const programmedOvertimeHours = programmed.overtimeTier1Hours + programmed.overtimeTier2Hours;
    expect(programmedOvertimeHours).toBeCloseTo(3);

    const actual = computeFullTimeWeek(36, contractWeekHours, DEFAULT_RULES);
    const actualOvertimeHours = actual.overtimeTier1Hours + actual.overtimeTier2Hours;
    expect(actualOvertimeHours).toBeCloseTo(1);

    expect(programmedOvertimeHours).not.toBeCloseTo(actualOvertimeHours);
  });
});

describe("computeProgrammedMinutesForDay — la pause déjeuner de la semaine type est déduite", () => {
  it("déduit la pause de la semaine type sur un jour au gabarit (09:00-17:00, pause 12:00-13:00 -> 7h)", () => {
    const templatesByDow = { 1: { startTime: "09:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" } };
    const minutes = computeProgrammedMinutesForDay(templatesByDow, undefined, 1);
    expect(minutes).toBe(7 * 60); // 8h de présence - 1h de pause
  });

  it("déduit aussi la pause sur un jour dont l'horaire a été modifié en masse (override), la pause reste celle de la semaine type", () => {
    const templatesByDow = { 1: { startTime: "09:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" } };
    const minutes = computeProgrammedMinutesForDay(templatesByDow, { plannedStart: "08:00", plannedEnd: "18:00" }, 1);
    expect(minutes).toBe(9 * 60); // 10h de présence - 1h de pause
  });

  it("ne déduit rien si aucune pause n'est définie dans la semaine type", () => {
    const templatesByDow = { 1: { startTime: "09:00", endTime: "17:00" } };
    const minutes = computeProgrammedMinutesForDay(templatesByDow, undefined, 1);
    expect(minutes).toBe(8 * 60);
  });
});

describe("computeMonthlySummary — heures de formation distinctes des heures travaillées", () => {
  it("les heures de formation comptent au contrat sans jamais s'ajouter à totalWorkedHours", () => {
    const workedMinutesByDay = Array(15).fill(7 * 60); // 105h réellement pointées
    const summary = computeMonthlySummary({
      contractType: "TEMPS_PLEIN",
      weeklyContractHours: 35,
      workedMinutesByDay,
      absenceHours: 0,
      formationHours: 21, // 3 jours de formation à 7h
      adjustmentMinutes: 0,
    });
    expect(summary.totalWorkedHours).toBeCloseTo(105); // jamais mélangé
    expect(summary.totalFormationHours).toBe(21);
    // Le solde tient compte du travail réel + de la formation.
    expect(summary.balanceHours).toBeCloseTo(105 + 21 - 35 * 4.33, 1);
  });
});
