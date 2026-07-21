import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 50;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: { actor: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ardoise-900">Journal d'audit</h1>
      <p className="text-sm text-ardoise-500">
        Toutes les actions sensibles (création/modification de comptes, corrections d'horaires, validations,
        sauvegardes...) sont tracées ici avec l'auteur, l'horodatage et les valeurs avant/après.
      </p>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ardoise-400">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Acteur</th>
              <th className="py-2 pr-4">Action</th>
              <th className="py-2 pr-4">Entité</th>
              <th className="py-2 pr-4">Détail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-ardoise-100 align-top">
                <td className="py-2 pr-4 whitespace-nowrap text-ardoise-500">
                  {log.createdAt.toLocaleString("fr-FR")}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "Système"}
                </td>
                <td className="py-2 pr-4 whitespace-nowrap font-medium text-ardoise-800">{log.action}</td>
                <td className="py-2 pr-4 whitespace-nowrap text-ardoise-500">
                  {log.entityType}
                  {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}
                </td>
                <td className="py-2 pr-4 max-w-md">
                  {log.oldValue && (
                    <details className="text-xs text-ardoise-500">
                      <summary>Voir détail</summary>
                      <pre className="mt-1 max-w-md overflow-x-auto whitespace-pre-wrap break-all">
                        Avant : {log.oldValue}
                        {log.newValue ? `\nAprès : ${log.newValue}` : ""}
                      </pre>
                    </details>
                  )}
                  {!log.oldValue && log.newValue && (
                    <details className="text-xs text-ardoise-500">
                      <summary>Voir détail</summary>
                      <pre className="mt-1 max-w-md overflow-x-auto whitespace-pre-wrap break-all">{log.newValue}</pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-ardoise-500">
        <span>
          Page {page} / {totalPages} — {total} entrées
        </span>
        <div className="flex gap-2">
          {page > 1 && <a className="btn-secondary" href={`/audit?page=${page - 1}`}>← Précédent</a>}
          {page < totalPages && <a className="btn-secondary" href={`/audit?page=${page + 1}`}>Suivant →</a>}
        </div>
      </div>
    </div>
  );
}
