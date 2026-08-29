import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SectionLabel from "@/components/SectionLabel";
import CorrectEntryForm from "./CorrectEntryForm";

const STATUS_LABELS: Record<string, string> = {
  PRE_REMPLI: "Pré-rempli",
  CONFIRME: "Confirmé",
  MODIFIE: "Modifié",
  A_VALIDER: "À valider",
  VALIDE: "Validé",
  REFUSE: "Refusé",
  CORRIGE: "Corrigé",
  VERROUILLE: "Verrouillé",
};

const STATUS_STYLES: Record<string, string> = {
  PRE_REMPLI: "bg-ardoise-100 text-ardoise-600",
  CONFIRME: "bg-faraday-50 text-faraday-700",
  MODIFIE: "bg-amber-50 text-amber-700",
  A_VALIDER: "bg-amber-100 text-amber-800",
  VALIDE: "bg-faraday-100 text-faraday-800",
  REFUSE: "bg-red-50 text-red-700",
  CORRIGE: "bg-blue-50 text-blue-700",
  VERROUILLE: "bg-ardoise-200 text-ardoise-600",
};

export default async function ValidationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN" && session.role !== "RH") redirect("/dashboard");

  const entries = await prisma.workEntry.findMany({
    where: { status: { in: ["A_VALIDER", "MODIFIE"] } },
    include: { user: { select: { firstName: true, lastName: true, color: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <SectionLabel>Validations</SectionLabel>
        <h1 className="mt-3 page-title">Validation des heures</h1>
        <p className="mt-2 text-sm text-ardoise-500">
          Journées modifiées par les assistant(e)s ou en attente de validation RH.
        </p>
      </div>

      <div className="card overflow-x-auto">
        {entries.length === 0 ? (
          <p className="text-sm text-ardoise-400">Aucune journée en attente de validation.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ardoise-200 text-left text-[11px] uppercase tracking-wider2 text-ardoise-400">
                <th className="pb-3 pr-4">Utilisateur</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Prévu</th>
                <th className="pb-3 pr-4">Déclaré</th>
                <th className="pb-3 pr-4">Statut</th>
                <th className="pb-3 pr-4">Commentaire</th>
                <th className="pb-3 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-ardoise-100 align-top last:border-0">
                  <td className="py-3.5 pr-4">
                    {e.user.firstName} {e.user.lastName}
                  </td>
                  <td className="py-3.5 pr-4">{new Date(e.date).toLocaleDateString("fr-FR")}</td>
                  <td className="py-3.5 pr-4 text-ardoise-500">
                    {e.plannedStart ?? "—"}-{e.plannedEnd ?? "—"}
                  </td>
                  <td className="py-3.5 pr-4 text-ardoise-700">
                    {e.actualStart ?? "—"}-{e.actualEnd ?? "—"} ({e.breakMinutes} min pause)
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className={`badge ${STATUS_STYLES[e.status]}`}>{STATUS_LABELS[e.status]}</span>
                  </td>
                  <td className="py-3.5 pr-4 max-w-xs text-ardoise-500">{e.comment || "—"}</td>
                  <td className="py-3.5 pr-4">
                    <CorrectEntryForm entryId={e.id} plannedStart={e.plannedStart} plannedEnd={e.plannedEnd} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
