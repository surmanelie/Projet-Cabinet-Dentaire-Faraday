import { describe, it, expect } from "vitest";
import {
  computeDayMinutes,
  computeFullTimeWeek,
  computePartTimeWeek,
  computeMonthlySummary,
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
    const r = computeFullTimeWeek(40, DEFAULT_RULES);
    expect(r.overtimeTier1Hours).toBe(5);
    expect(r.overtimeTier2Hours).toBe(0);
    expect(r.overtimeTier1Pay).toBeCloseTo(5 * 1.25);
  });

  it("majore à 50% au-delà de la 43e heure", () => {
    const r = computeFullTimeWeek(45, DEFAULT_RULES);
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
    const r = computeFullTimeWeek(30, DEFAULT_RULES);
    expect(r.deficitHours).toBe(5);
    expect(r.overtimeTier1Pay).toBe(0);
    expect(r.overtimeTier2Pay).toBe(0);
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
      adjustmentMinutes: -120, // -2h, ex: trop payé le mois précédent
    });
    expect(summary.totalAdjustmentHours).toBe(-2);
  });
});
