import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import { getAgendaData, dateKey } from "@/lib/agenda";
import { computeMonthlyRecap } from "@/lib/actions/monthly-validation";
import SectionLabel from "@/components/SectionLabel";
import MonthAgenda from "@/components/MonthAgenda";
import SelectablePlanningCalendar from "@/components/SelectablePlanningCalendar";
import HoursGauge from "@/components/HoursGauge";
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
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      assistantProfile: { select: { weeklyContractHours: true } },
    },
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
        <h1 className="page-title">Planning</h1>
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

  let hours = { worked: 0, target: 0, overtime: 0, missing: 0 };
  if (selectedId) {
    try {
      const recap = await computeMonthlyRecap(selectedId, month, year);
      hours = {
        worked: recap.totalWorkedHours,
        target: recap.totalPlannedHours,
        overtime: recap.overtimeHours,
        missing: recap.deficitHours,
      };
    } catch {
      /* pas de données */
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel>Agenda</SectionLabel>
          <h1 className="mt-3 page-title">Planning</h1>
        </div>
        {admin && (
          <AgendaUserPicker users={users} selectedId={selectedId ?? ""} month={month} year={year} />
        )}
      </div>

      {selected && (
        <div className="card flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-semibold tracking-tight text-ardoise-900">{selected.firstName} {selected.lastName}</p>
            <p className="text-sm text-ardoise-500">Heures du mois</p>
            <div className="mt-2 flex gap-2 text-sm">
              <Link href={`/equipe/heures`} className="text-faraday-700 hover:underline">Suivi détaillé</Link>
              <span className="text-ardoise-300">·</span>
              <Link href="/equipe" className="text-faraday-700 hover:underline">Fiche</Link>
            </div>
          </div>
          <HoursGauge worked={hours.worked} target={hours.target} overtime={hours.overtime} missing={hours.missing} size={140} />
        </div>
      )}

      {admin && selectedId ? (
        <SelectablePlanningCalendar
          userId={selectedId}
          year={year}
          month={month}
          todayKey={dateKey(now)}
          templatesByDow={templatesByDow}
          entriesByDate={entriesByDate}
          prevHref={`/planning?${q}&month=${prevMonth}&year=${prevYear}`}
          nextHref={`/planning?${q}&month=${nextMonth}&year=${nextYear}`}
          weeklyContractHours={selected?.assistantProfile?.weeklyContractHours ?? 35}
        />
      ) : (
        <MonthAgenda
          year={year}
          month={month}
          todayKey={dateKey(now)}
          templatesByDow={templatesByDow}
          entriesByDate={entriesByDate}
          prevHref={`/planning?${q}&month=${prevMonth}&year=${prevYear}`}
          nextHref={`/planning?${q}&month=${nextMonth}&year=${nextYear}`}
        />
      )}

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
