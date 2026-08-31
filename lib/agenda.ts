import "server-only";
import { prisma } from "./prisma";
import type { DayTemplate, DayEntry } from "@/components/MonthAgenda";
import { startOfParisDay, endOfParisDay } from "@/lib/timezone";

/**
 * "YYYY-MM-DD" tel que vécu à Paris — jamais via les accesseurs locaux de
 * Date (`getFullYear`/`getMonth`/`getDate`), qui dépendent du fuseau du
 * processus serveur et décalaient les entrées d'un jour sur la grille de
 * l'agenda quand le serveur tourne en UTC.
 */
export function dateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Construit les données de l'agenda mensuel d'un utilisateur : la semaine type
 * (horaires récurrents par jour) et les journées réelles du mois (pointages,
 * congés).
 */
export async function getAgendaData(userId: string, year: number, month: number) {
  const start = startOfParisDay(new Date(year, month - 1, 1));
  const end = endOfParisDay(new Date(year, month - 1, new Date(year, month, 0).getDate()));

  const [templates, entries] = await Promise.all([
    prisma.scheduleTemplate.findMany({ where: { userId, active: true } }),
    prisma.workEntry.findMany({ where: { userId, date: { gte: start, lte: end } } }),
  ]);

  const templatesByDow: Record<number, DayTemplate> = {};
  for (const t of templates) {
    templatesByDow[t.dayOfWeek] = {
      startTime: t.startTime,
      endTime: t.endTime,
      breakStart: t.breakStart,
      breakEnd: t.breakEnd,
    };
  }

  const entriesByDate: Record<string, DayEntry> = {};
  for (const e of entries) {
    entriesByDate[dateKey(new Date(e.date))] = {
      source: e.source,
      actualStart: e.actualStart,
      actualEnd: e.actualEnd,
      comment: e.comment,
      plannedStart: e.plannedStart,
      plannedEnd: e.plannedEnd,
      locked: e.locked,
    };
  }

  return { templatesByDow, entriesByDate };
}
