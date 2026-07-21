import "server-only";
import { prisma } from "./prisma";
import type { DayTemplate, DayEntry } from "@/components/MonthAgenda";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Construit les données de l'agenda mensuel d'un utilisateur : la semaine type
 * (horaires récurrents par jour) et les journées réelles du mois (pointages,
 * congés).
 */
export async function getAgendaData(userId: string, year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const [templates, entries] = await Promise.all([
    prisma.scheduleTemplate.findMany({ where: { userId, active: true } }),
    prisma.workEntry.findMany({ where: { userId, date: { gte: start, lte: end } } }),
  ]);

  const templatesByDow: Record<number, DayTemplate> = {};
  for (const t of templates) {
    templatesByDow[t.dayOfWeek] = { startTime: t.startTime, endTime: t.endTime };
  }

  const entriesByDate: Record<string, DayEntry> = {};
  for (const e of entries) {
    entriesByDate[dateKey(new Date(e.date))] = {
      source: e.source,
      actualStart: e.actualStart,
      actualEnd: e.actualEnd,
      comment: e.comment,
    };
  }

  return { templatesByDow, entriesByDate };
}
