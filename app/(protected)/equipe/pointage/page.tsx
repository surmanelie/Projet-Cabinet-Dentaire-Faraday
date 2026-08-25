import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAllTodayClockEntries, getClockStatus } from "@/lib/actions/clock";
import QrCodes from "./QrCodes";
import AdminClockEdit from "./AdminClockEdit";

const STATUS_LABELS: Record<string, { label: string; dot: string }> = {
  ABSENT:           { label: "Absent·e",         dot: "bg-ardoise-300" },
  PRESENT:          { label: "En poste",          dot: "bg-emerald-500" },
  EN_PAUSE:         { label: "En pause",          dot: "bg-amber-400" },
  JOURNEE_TERMINEE: { label: "Journée terminée",  dot: "bg-slate-400" },
};

const ACTION_LABELS: Record<string, string> = {
  DEBUT_JOURNEE: "Début journée",
  DEBUT_PAUSE:   "Début pause",
  FIN_PAUSE:     "Fin pause",
  FIN_JOURNEE:   "Fin journée",
};

export default async function AdminPointagePage() {
  const assistants = await prisma.user.findMany({
    where: { role: "ASSISTANT", active: true },
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true, color: true },
  });

  // Statut + pointages du jour pour chacune.
  const [statusList, todayEntries] = await Promise.all([
    Promise.all(
      assistants.map(async (a) => ({ ...a, status: await getClockStatus(a.id) }))
    ),
    getAllTodayClockEntries(),
  ]);

  // Compteurs rapides
  const counts = {
    present:  statusList.filter((a) => a.status === "PRESENT").length,
    pause:    statusList.filter((a) => a.status === "EN_PAUSE").length,
    termine:  statusList.filter((a) => a.status === "JOURNEE_TERMINEE").length,
    absent:   statusList.filter((a) => a.status === "ABSENT").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ardoise-900">Pointage QR — Suivi en temps réel</h1>
        <p className="text-sm text-ardoise-500">
          Affichez ou imprimez les QR codes. Consultez le statut des assistantes.
        </p>
      </div>

      {/* ── Compteurs ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="En poste"        value={counts.present}  color="text-emerald-600" />
        <StatTile label="En pause"        value={counts.pause}    color="text-amber-600" />
        <StatTile label="Journée terminée" value={counts.termine}  color="text-slate-500" />
        <StatTile label="Absente"         value={counts.absent}   color="text-ardoise-400" />
      </div>

      {/* ── QR Codes ── */}
      <QrCodes />

      {/* ── Statut des assistantes ── */}
      <div className="card">
        <h2 className="mb-4 text-sm font-semibold text-ardoise-900">Statut des assistantes</h2>
        {statusList.length === 0 ? (
          <p className="text-sm text-ardoise-400">Aucune assistante active.</p>
        ) : (
          <div className="divide-y divide-ardoise-100">
            {statusList.map((a) => {
              const s = STATUS_LABELS[a.status];
              const myEntries = todayEntries.filter((e) => e.userId === a.id);
              const firstEntry = myEntries.find((e) => e.action === "DEBUT_JOURNEE");
              const lastEntry = myEntries[myEntries.length - 1];

              return (
                <div key={a.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: a.color }}
                      >
                        {a.firstName[0]}{a.lastName[0]}
                      </div>
                      <Link href={`/planning?user=${a.id}`} className="font-medium text-ardoise-900 hover:text-faraday-700 hover:underline">
                        {a.firstName} {a.lastName}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                      <span className="text-sm text-ardoise-600">{s.label}</span>
                    </div>
                  </div>

                  {myEntries.length > 0 && (
                    <div className="mt-2 ml-9 space-y-1">
                      {myEntries.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 text-xs text-ardoise-500">
                          <span className="w-32">{ACTION_LABELS[e.action]}</span>
                          <span>
                            {e.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {e.source === "admin" && (
                            <span className="text-amber-600">(admin)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Correction admin ── */}
      <AdminClockEdit assistants={assistants} todayEntries={todayEntries} />
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-ardoise-500">{label}</p>
    </div>
  );
}
