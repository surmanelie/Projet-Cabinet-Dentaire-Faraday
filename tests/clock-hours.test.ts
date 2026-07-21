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
});
