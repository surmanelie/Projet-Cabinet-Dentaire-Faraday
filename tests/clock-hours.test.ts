import { describe, it, expect } from "vitest";
import { deriveDayFromClock, type ClockEvent } from "@/lib/clock-hours";

/** Petit utilitaire : construit un timestamp du jour à HH:MM. */
function at(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2026, 0, 5, h, m, 0, 0); // lundi 5 janvier 2026
  return d;
}

describe("deriveDayFromClock", () => {
  it("dérive une journée complète avec une pause", () => {
    const events: ClockEvent[] = [
      { action: "DEBUT_JOURNEE", timestamp: at("09:00") },
      { action: "DEBUT_PAUSE", timestamp: at("12:30") },
      { action: "FIN_PAUSE", timestamp: at("13:30") },
      { action: "FIN_JOURNEE", timestamp: at("17:00") },
    ];
    const day = deriveDayFromClock(events);
    expect(day.actualStart).toBe("09:00");
    expect(day.actualEnd).toBe("17:00");
    expect(day.breakMinutes).toBe(60);
    expect(day.complete).toBe(true);
  });

  it("additionne plusieurs pauses", () => {
    const events: ClockEvent[] = [
      { action: "DEBUT_JOURNEE", timestamp: at("09:00") },
      { action: "DEBUT_PAUSE", timestamp: at("10:30") },
      { action: "FIN_PAUSE", timestamp: at("10:45") },
      { action: "DEBUT_PAUSE", timestamp: at("12:30") },
      { action: "FIN_PAUSE", timestamp: at("13:30") },
      { action: "FIN_JOURNEE", timestamp: at("17:00") },
    ];
    const day = deriveDayFromClock(events);
    expect(day.breakMinutes).toBe(75); // 15 + 60
  });

  it("gère une journée non terminée (pas de fin)", () => {
    const events: ClockEvent[] = [{ action: "DEBUT_JOURNEE", timestamp: at("09:00") }];
    const day = deriveDayFromClock(events);
    expect(day.actualStart).toBe("09:00");
    expect(day.actualEnd).toBeNull();
    expect(day.complete).toBe(false);
  });

  it("ignore une pause ouverte non refermée", () => {
    const events: ClockEvent[] = [
      { action: "DEBUT_JOURNEE", timestamp: at("09:00") },
      { action: "DEBUT_PAUSE", timestamp: at("12:30") },
      { action: "FIN_JOURNEE", timestamp: at("17:00") },
    ];
    const day = deriveDayFromClock(events);
    expect(day.breakMinutes).toBe(0);
    expect(day.complete).toBe(true);
  });

  it("reste robuste à un ordre d'événements non trié", () => {
    const events: ClockEvent[] = [
      { action: "FIN_JOURNEE", timestamp: at("17:00") },
      { action: "DEBUT_JOURNEE", timestamp: at("09:00") },
    ];
    const day = deriveDayFromClock(events);
    expect(day.actualStart).toBe("09:00");
    expect(day.actualEnd).toBe("17:00");
  });

  it("renvoie une journée vide sans événement", () => {
    const day = deriveDayFromClock([]);
    expect(day.actualStart).toBeNull();
    expect(day.actualEnd).toBeNull();
    expect(day.breakMinutes).toBe(0);
    expect(day.complete).toBe(false);
  });

  describe("plusieurs sessions dans la même journée", () => {
    it("additionne deux sessions séparées par une coupure méridienne", () => {
      // 08:30 → 12:30 puis 13:30 → 18:00 : la coupure entre les deux
      // sessions (12:30→13:30) est exclue comme une pause, sans que ce
      // soit une vraie pause pointée.
      const events: ClockEvent[] = [
        { action: "DEBUT_JOURNEE", timestamp: at("08:30") },
        { action: "FIN_JOURNEE", timestamp: at("12:30") },
        { action: "DEBUT_JOURNEE", timestamp: at("13:30") },
        { action: "FIN_JOURNEE", timestamp: at("18:00") },
      ];
      const day = deriveDayFromClock(events);
      expect(day.actualStart).toBe("08:30");
      expect(day.actualEnd).toBe("18:00");
      expect(day.breakMinutes).toBe(60); // la coupure 12:30-13:30
      // Total span (08:30-18:00 = 9h30) - 1h de coupure = 8h30 travaillées.
    });

    it("gère une fin de journée pointée par erreur puis une reprise immédiate", () => {
      // 08:30 début, 09:00 fin (erreur), 09:02 reprise, 12:30 fin,
      // 13:30 reprise, 18:00 fin.
      const events: ClockEvent[] = [
        { action: "DEBUT_JOURNEE", timestamp: at("08:30") },
        { action: "FIN_JOURNEE", timestamp: at("09:00") },
        { action: "DEBUT_JOURNEE", timestamp: at("09:02") },
        { action: "FIN_JOURNEE", timestamp: at("12:30") },
        { action: "DEBUT_JOURNEE", timestamp: at("13:30") },
        { action: "FIN_JOURNEE", timestamp: at("18:00") },
      ];
      const day = deriveDayFromClock(events);
      expect(day.actualStart).toBe("08:30");
      expect(day.actualEnd).toBe("18:00");
      // Coupures exclues : 09:00-09:02 (2 min) + 12:30-13:30 (60 min) = 62 min.
      expect(day.breakMinutes).toBe(62);
      // Span total 08:30-18:00 = 9h30 (570 min) - 62 min = 508 min = 8h28.
    });

    it("combine une vraie pause et une coupure inter-sessions dans la même journée", () => {
      const events: ClockEvent[] = [
        { action: "DEBUT_JOURNEE", timestamp: at("08:00") },
        { action: "DEBUT_PAUSE", timestamp: at("10:00") },
        { action: "FIN_PAUSE", timestamp: at("10:15") },
        { action: "FIN_JOURNEE", timestamp: at("12:00") },
        { action: "DEBUT_JOURNEE", timestamp: at("13:00") },
        { action: "FIN_JOURNEE", timestamp: at("17:00") },
      ];
      const day = deriveDayFromClock(events);
      // Pause 15 min + coupure inter-session 60 min = 75 min exclues.
      expect(day.breakMinutes).toBe(75);
      expect(day.actualStart).toBe("08:00");
      expect(day.actualEnd).toBe("17:00");
    });

    it("n'exclut rien après le dernier FIN_JOURNEE (coupure finale ouverte, ignorée)", () => {
      const events: ClockEvent[] = [
        { action: "DEBUT_JOURNEE", timestamp: at("08:30") },
        { action: "FIN_JOURNEE", timestamp: at("17:00") },
      ];
      const day = deriveDayFromClock(events);
      expect(day.breakMinutes).toBe(0);
      expect(day.complete).toBe(true);
    });
  });
});
