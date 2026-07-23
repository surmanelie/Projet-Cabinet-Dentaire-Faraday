import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import UserForm from "./UserForm";
import ToggleActiveButton from "./ToggleActiveButton";
import ResendInviteButton from "./ResendInviteButton";
import EditUserModal from "./EditUserModal";
import DeleteUserButton from "./DeleteUserButton";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RH: "RH",
  PRATICIEN: "Praticien",
  ASSISTANT: "Assistant(e)",
  COMPTABLE: "Comptable",
};

export default async function EquipePage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { lastName: "asc" }],
    include: { assistantProfile: true, practitionerProfile: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ardoise-900">Équipe</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/equipe/assistants" className="text-faraday-600 hover:underline">Vue assistantes</Link>
          <Link href="/equipe/praticiens" className="text-faraday-600 hover:underline">Vue praticiens</Link>
          <Link href="/equipe/heures" className="text-faraday-600 hover:underline">Suivi des heures</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ardoise-400">
                <th className="py-2">Nom</th>
                <th className="py-2">Email</th>
                <th className="py-2">Rôle</th>
                <th className="py-2">Statut</th>
                <th className="py-2">Compte</th>
                {isAdmin && <th className="py-2">Action</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-ardoise-100">
                  <td className="py-2">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: u.color }} />
                    {u.role === "ASSISTANT" || u.role === "PRATICIEN" ? (
                      <Link href={`/planning?user=${u.id}`} className="font-medium text-faraday-700 hover:underline">
                        {u.firstName} {u.lastName}
                      </Link>
                    ) : (
                      <span>{u.firstName} {u.lastName}</span>
                    )}
                  </td>
                  <td className="py-2 text-ardoise-500">{u.email}</td>
                  <td className="py-2">{ROLE_LABELS[u.role]}</td>
                  <td className="py-2">
                    <span className={`badge ${u.active ? "bg-faraday-50 text-faraday-700" : "bg-ardoise-100 text-ardoise-500"}`}>
                      {u.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="py-2">
                    {u.inviteToken ? (
                      <span className="badge bg-amber-50 text-amber-700">Invitation en attente</span>
                    ) : (
                      <span className="badge bg-faraday-50 text-faraday-700">Activé</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-2">
                      <div className="flex flex-wrap items-start gap-2">
                        <EditUserModal
                          user={{
                            id: u.id,
                            firstName: u.firstName,
                            lastName: u.lastName,
                            email: u.email,
                            phone: u.phone,
                            color: u.color,
                            role: u.role,
                            hasClockPin: Boolean(u.clockPinHash),
                            assistantProfile: u.assistantProfile
                              ? {
                                  contractType: u.assistantProfile.contractType,
                                  weeklyContractHours: u.assistantProfile.weeklyContractHours,
                                  notes: u.assistantProfile.notes,
                                }
                              : null,
                            practitionerProfile: u.practitionerProfile
                              ? { specialty: u.practitionerProfile.specialty, room: u.practitionerProfile.room }
                              : null,
                          }}
                        />
                        <ToggleActiveButton userId={u.id} active={u.active} />
                        <ResendInviteButton userId={u.id} />
                        <DeleteUserButton userId={u.id} userName={`${u.firstName} ${u.lastName}`} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isAdmin ? (
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Ajouter un utilisateur</h2>
            <p className="mb-3 text-xs text-ardoise-500">
              Définis un mot de passe directement pour une connexion immédiate, ou laisse le champ vide pour générer
              un lien d&apos;activation à transmettre.
            </p>
            <UserForm />
          </div>
        ) : (
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ardoise-900">Inviter un utilisateur</h2>
            <p className="text-sm text-ardoise-500">
              Seul le compte Administrateur peut créer ou inviter de nouveaux comptes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
