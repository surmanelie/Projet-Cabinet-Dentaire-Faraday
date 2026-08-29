import { getSession } from "@/lib/auth";
import { getAgendaData, dateKey } from "@/lib/agenda";
import MonthAgenda from "@/components/MonthAgenda";
import SectionLabel from "@/components/SectionLabel";

export default async function MesHorairesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();
  const params = await searchParams;
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();

  const { templatesByDow, entriesByDate } = await getAgendaData(session.id, year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <SectionLabel>Agenda</SectionLabel>
        <h1 className="mt-3 page-title">Mon agenda</h1>
        <p className="mt-2 text-sm text-ardoise-500">Vos horaires prévus, vos congés et vos heures pointées.</p>
      </div>

      <MonthAgenda
        year={year}
        month={month}
        todayKey={dateKey(now)}
        templatesByDow={templatesByDow}
        entriesByDate={entriesByDate}
        prevHref={`/mes-horaires?month=${prevMonth}&year=${prevYear}`}
        nextHref={`/mes-horaires?month=${nextMonth}&year=${nextYear}`}
      />
    </div>
  );
}
