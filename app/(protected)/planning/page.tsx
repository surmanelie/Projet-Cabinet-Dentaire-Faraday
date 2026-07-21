import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import { getAgendaData, dateKey } from "@/lib/agenda";
import MonthAgenda from "@/components/MonthAgenda";
import AgendaUserPicker from "./AgendaUserPicker";
import ScheduleTemplateForm from "./ScheduleTemplateForm";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; month?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;
  const admin = isAdminOrRh(session.role);

  const now = new Date();
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();

  const users = await prisma.user.findMany({
    where: { active: true, role: { in: ["ASSISTANT", "PRATICIEN"] } },
    select: { id: true, firstName: true, lastName: true, role: true },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  // Le praticien ne voit que son propre agenda ; l'admin/RH choisit la personne.
  const selectedId = admin
    ? params.user && users.some((u) => u.id === params.user)
      ? params.user
      : users[0]?.id
    : session.id;

  const selected = users.find((u) => u.id === selectedId) ?? null;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const q = `user=${selectedId ?? ""}`;

  if (admin && users.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-ardoise-900">Planning</h1>
        <div className="card text-center">
          <p className="text-ardoise-500">Aucune assistante pour le moment.</p>
          <Link href="/equipe" className="btn-primary mt-3 inline-flex">Ajouter une assistante</Link>
        </div>
      </div>
    );
  }

  const { templatesByDow, entriesByDate } = selectedId
    ? await getAgendaData(selectedId, year, month)
    : { templatesByDow: {}, entriesByDate: {} };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ardoise-900">Planning</h1>
        {admin && (
          <AgendaUserPicker users={users} selectedId={selectedId ?? ""} month={month} year={year} />
        )}
      </div>

      {selected && (
        <p className="text-sm text-ardoise-500">
          Agenda de <span className="font-medium text-ardoise-700">{selected.firstName} {selected.lastName}</span>
        </p>
      )}

      <MonthAgenda
        year={year}
        month={month}
        todayKey={dateKey(now)}
        templatesByDow={templatesByDow}
        entriesByDate={entriesByDate}
        prevHref={`/planning?${q}&month=${prevMonth}&year=${prevYear}`}
        nextHref={`/planning?${q}&month=${nextMonth}&year=${nextYear}`}
      />

      {admin && selectedId && (
        <details className="card">
          <summary className="cursor-pointer text-sm font-medium text-ardoise-900">
            Modifier la semaine type de {selected?.firstName}
          </summary>
          <p className="mb-3 mt-2 text-xs text-ardoise-500">
            Réglez l&apos;horaire d&apos;un jour : il se répète chaque semaine automatiquement. Un dépassement au
            pointage compte en heures supplémentaires.
          </p>
          <ScheduleTemplateForm users={users} presetUserId={selectedId} />
        </details>
      )}
    </div>
  );
}
