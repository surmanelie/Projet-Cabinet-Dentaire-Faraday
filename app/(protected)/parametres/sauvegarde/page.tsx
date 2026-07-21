import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listBackupsAction } from "@/lib/actions/backup";
import BackupActions from "./BackupActions";
import DeleteBackupButton from "./DeleteBackupButton";

export default async function SauvegardePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const backups = await listBackupsAction();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-ardoise-900">Sauvegarde &amp; restauration</h1>
      <p className="text-sm text-ardoise-500">
        La base de données SQLite locale peut être sauvegardée et restaurée directement depuis l'interface.
      </p>

      <div className="card">
        <BackupActions />
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Sauvegardes disponibles</h2>
        {backups.length === 0 ? (
          <p className="text-sm text-ardoise-400">Aucune sauvegarde pour le moment.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {backups.map((b) => (
              <li key={b.name} className="flex items-center justify-between border-b border-ardoise-100 pb-1">
                <div>
                  <p className="text-ardoise-700">{b.name}</p>
                  <p className="text-xs text-ardoise-400">
                    {(b.size / 1024).toFixed(0)} Ko — {new Date(b.mtime).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="flex gap-3">
                  <a className="text-xs text-faraday-600 hover:underline" href={`/api/backup/${b.name}`}>
                    Télécharger
                  </a>
                  <DeleteBackupButton fileName={b.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
