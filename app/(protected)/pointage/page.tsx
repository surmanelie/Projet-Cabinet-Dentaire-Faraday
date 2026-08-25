import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getTodayClockEntries, getClockStatus } from "@/lib/actions/clock";
import SectionLabel from "@/components/SectionLabel";

const ACTION_LINKS = [
  { href: "/pointage/debut",       label: "Début de journée", color: "border-ardoise-200 bg-white hover:border-faraday-700" },
  { href: "/pointage/pause-debut", label: "Début de pause",   color: "border-ardoise-200 bg-white hover:border-faraday-700" },
  { href: "/pointage/pause-fin",   label: "Fin de pause",     color: "border-ardoise-200 bg-white hover:border-faraday-700" },
  { href: "/pointage/fin",         label: "Fin de journée",   color: "border-ardoise-200 bg-white hover:border-faraday-700" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ABSENT:            { label: "Absent·e",          color: "bg-ardoise-100 text-ardoise-600" },
  PRESENT:           { label: "En poste",           color: "bg-emerald-100 text-emerald-700" },
  EN_PAUSE:          { label: "En pause",           color: "bg-amber-100 text-amber-700" },
  JOURNEE_TERMINEE:  { label: "Journée terminée",   color: "bg-slate-100 text-slate-600" },
};

const ACTION_LABELS: Record<string, string> = {
  DEBUT_JOURNEE: "Début journée",
  DEBUT_PAUSE:   "Début pause",
  FIN_PAUSE:     "Fin pause",
  FIN_JOURNEE:   "Fin journée",
};

export default async function PointageIndexPage() {
  const session = await getSession();
  if (!session) return null;

  const [entries, status] = await Promise.all([
    getTodayClockEntries(session.id),
    getClockStatus(session.id),
  ]);

  const statusInfo = STATUS_LABELS[status];

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <SectionLabel>Mon suivi</SectionLabel>
        <h1 className="mt-3 font-serif text-4xl italic text-ardoise-900">Pointage</h1>
        <p className="mt-2 text-sm text-ardoise-500">
          Statut actuel :{" "}
          <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
        </p>
      </div>

      {/* Boutons de pointage rapide (même sur PC) */}
      <div className="card">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">
          Scanner un QR code ou pointer directement
        </p>
        <div className="grid grid-cols-2 gap-3">
          {ACTION_LINKS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`flex flex-col items-center rounded border p-4 text-center transition-all duration-200 ease-premium ${a.color}`}
            >
              <span className="text-sm font-medium text-ardoise-800">{a.label}</span>
            </Link>
          ))}
        </div>
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
                  {e.timestamp.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
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
