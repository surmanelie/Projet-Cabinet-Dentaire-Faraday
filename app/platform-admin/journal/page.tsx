import Link from "next/link";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 40;

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.p) || 1);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-white">Journal d&apos;audit <span className="text-ardoise-400">({total})</span></h1>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-ardoise-400">
              <th className="p-3">Date</th>
              <th className="p-3">Auteur</th>
              <th className="p-3">Action</th>
              <th className="p-3">Ressource</th>
              <th className="p-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-white/5">
                <td className="p-3 text-ardoise-300">{l.createdAt.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="p-3 text-ardoise-300">{l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : "système"}</td>
                <td className="p-3 text-white">{l.action}</td>
                <td className="p-3 text-ardoise-400">{l.entityType}{l.entityId ? ` · ${l.entityId.slice(0, 8)}` : ""}</td>
                <td className="p-3 text-ardoise-500">{l.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ardoise-400">Aucune entrée.</td></tr>}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-ardoise-300">
          {page > 1 && <Link href={`?p=${page - 1}`} className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10">← Précédent</Link>}
          <span>Page {page} / {pages}</span>
          {page < pages && <Link href={`?p=${page + 1}`} className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10">Suivant →</Link>}
        </div>
      )}
    </div>
  );
}
