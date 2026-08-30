import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getTodayClockEntries, getClockStatus } from "@/lib/actions/clock";
import { ALLOWED_BY_STATUS } from "@/lib/clock-hours";
import { CABINET_TIMEZONE } from "@/lib/timezone";
import SectionLabel from "@/components/SectionLabel";
import type { ClockAction } from "@prisma/client";

const ACTION_HREF: Record<ClockAction, string> = {
  DEBUT_JOURNEE: "/pointage/debut",
  DEBUT_PAUSE: "/pointage/pause-debut",
  FIN_PAUSE: "/pointage/pause-fin",
  FIN_JOURNEE: "/pointage/fin",
};

const ACTION_LABELS: Record<string, string> = {
  DEBUT_JOURNEE: "Début de journée",
  DEBUT_PAUSE: "Début de pause",
  FIN_PAUSE: "Fin de pause",
  FIN_JOURNEE: "Fin de journée",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ABSENT:            { label: "Absent·e",          color: "bg-ardoise-100 text-ardoise-600" },
  PRESENT:           { label: "En poste",           color: "bg-emerald-100 text-emerald-700" },
  EN_PAUSE:          { label: "En pause",           color: "bg-amber-100 text-amber-700" },
  JOURNEE_TERMINEE:  { label: "Journée terminée",   color: "bg-slate-100 text-slate-600" },
};

export default async function PointageIndexPage() {
  const session = await getSession();
  if (!session) return null;

  const [entries, status] = await Promise.all([
    getTodayClockEntries(session.id),
    getClockStatus(session.id),
  ]);

  const statusInfo = STATUS_LABELS[status];
  const allowed = ALLOWED_BY_STATUS[status];

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <SectionLabel>Mon suivi</SectionLabel>
        <h1 className="mt-3 page-title">Pointage</h1>
        <p className="mt-2 text-sm text-ardoise-500">
          Statut actuel :{" "}
          <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
        </p>
      </div>

      {/* Seules les actions cohérentes avec l'état actuel sont proposées —
          même logique que le pointage QR/PIN. */}
      <div className="card">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Pointer</p>
        {allowed.length === 0 ? (
          <p className="text-sm text-ardoise-400">Rien à pointer pour le moment — à demain !</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {allowed.map((a) => (
              <Link
                key={a}
                href={ACTION_HREF[a]}
                className="flex flex-col items-center rounded border border-ardoise-200 bg-white p-4 text-center transition-all duration-200 ease-premium hover:border-faraday-700"
              >
                <span className="text-sm font-medium text-ardoise-800">{ACTION_LABELS[a]}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Historique du jour */}
      <div className="card">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Mes pointages aujourd&apos;hui</p>
        {entries.length === 0 ? (
          <p className="text-sm text-ardoise-400">Aucun pointage enregistré aujourd&apos;hui.</p>
        ) : (
          <ul className="divide-y divide-ardoise-100">
            {entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ardoise-700">{ACTION_LABELS[e.action] ?? e.action}</span>
                <span className="text-ardoise-400">
                  {e.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: CABINET_TIMEZONE })}
                  {e.source === "admin" && (
                    <span className="ml-2 text-xs text-amber-600">(corrigé)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-ardoise-400 text-center">
        L&apos;heure enregistrée est toujours celle du serveur — elle ne peut pas être modifiée manuellement.
      </p>
    </div>
  );
}
