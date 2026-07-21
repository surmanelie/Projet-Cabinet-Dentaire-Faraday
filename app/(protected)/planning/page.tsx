import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import ScheduleTemplateForm from "./ScheduleTemplateForm";

// Convention identique à Prisma/JS Date.getDay() : 0 = dimanche ... 6 = samedi.
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const baseDate = params.week ? new Date(params.week) : new Date();
  const monday = startOfWeek(baseDate);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ["ASSISTANT", "PRATICIEN"] } },
    select: { id: true, firstName: true, lastName: true, role: true, color: true },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  const entries = await prisma.workEntry.findMany({
    where: { date: { gte: monday, lte: sunday } },
    include: { user: { select: { firstName: true, lastName: true, color: true } } },
    orderBy: { date: "asc" },
  });

  const templates = isAdminOrRh(session!.role)
    ? await prisma.scheduleTemplate.findMany({
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: [{ userId: "asc" }, { dayOfWeek: "asc" }],
      })
    : [];

  const prevWeek = new Date(monday);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(monday);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ardoise-900">
          Planning — semaine du {monday.toLocaleDateString("fr-FR")} au {sunday.toLocaleDateString("fr-FR")}
        </h1>
        <div className="flex gap-2 text-sm">
          <a className="btn-secondary" href={`/planning?week=${prevWeek.toISOString().slice(0, 10)}`}>
            ← Semaine précédente
          </a>
          <a className="btn-secondary" href={`/planning?week=${nextWeek.toISOString().slice(0, 10)}`}>
            Semaine suivante →
          </a>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ardoise-400">
              <th className="py-2 pr-4">Utilisateur</th>
              {weekDates.map((d) => (
                <th key={d.toISOString()} className="py-2 pr-4">
                  {DAYS[d.getDay()]}
                  <br />
                  {d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-ardoise-100">
                <td className="py-2 pr-4">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: u.color }} />
                  {u.firstName} {u.lastName}
                </td>
                {weekDates.map((d) => {
                  const entry = entries.find(
                    (e) => e.userId === u.id && new Date(e.date).toDateString() === d.toDateString()
                  );
                  return (
                    <td key={d.toISOString()} className="py-2 pr-4 text-ardoise-600">
                      {entry ? (
                        <span>
                          {entry.plannedStart ?? "—"}-{entry.plannedEnd ?? "—"}
                        </span>
                      ) : (
                        <span className="text-ardoise-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdminOrRh(session!.role) && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Horaires types</h2>
          <ScheduleTemplateForm users={users} />

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ardoise-400">
                  <th className="py-2">Utilisateur</th>
                  <th className="py-2">Jour</th>
                  <th className="py-2">Horaire</th>
                  <th className="py-2">Pause</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-t border-ardoise-100">
                    <td className="py-2">
                      {t.user.firstName} {t.user.lastName}
                    </td>
                    <td className="py-2">{DAYS[t.dayOfWeek]}</td>
                    <td className="py-2">
                      {t.startTime} - {t.endTime}
                    </td>
                    <td className="py-2">{t.breakStart && t.breakEnd ? `${t.breakStart} - ${t.breakEnd}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
