import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import SectionLabel from "@/components/SectionLabel";
import UserForm from "./UserForm";
import ToggleActiveButton from "./ToggleActiveButton";
import ResendInviteButton from "./ResendInviteButton";
import EditUserModal from "./EditUserModal";
import DeleteUserButton from "./DeleteUserButton";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RH: "RH",
  PRATICIEN: "Praticien",
  ASSISTANT: "Employé",
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
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <SectionLabel>Équipe</SectionLabel>
          <h1 className="mt-3 page-title">Employés</h1>
        </div>
        <Link href="/equipe/heures" className="btn-ghost">
          Suivi des heures <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ardoise-200 text-left text-[11px] uppercase tracking-wider2 text-ardoise-400">
                <th className="pb-3">Nom</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Rôle</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3">Compte</th>
                {isAdmin && <th className="pb-3">Action</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ardoise-100 last:border-0">
                  <td className="py-3.5">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: u.color }} />
                    {u.role === "ASSISTANT" || u.role === "PRATICIEN" ? (
                      <Link href={`/planning?user=${u.id}`} className="font-medium text-ardoise-900 transition-colors hover:text-faraday-700">
                        {u.firstName} {u.lastName}
                      </Link>
                    ) : (
                      <span className="text-ardoise-900">{u.firstName} {u.lastName}</span>
                    )}
                  </td>
                  <td className="py-3.5 text-ardoise-500">{u.email}</td>
                  <td className="py-3.5 text-ardoise-700">{ROLE_LABELS[u.role]}</td>
                  <td className="py-3.5">
                    <span className={`badge ${u.active ? "bg-faraday-50 text-faraday-700" : "bg-ardoise-100 text-ardoise-500"}`}>
                      {u.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="py-3.5">
                    {u.inviteToken ? (
                      <span className="badge bg-amber-50 text-amber-800">Invitation en attente</span>
                    ) : (
                      <span className="badge bg-faraday-50 text-faraday-700">Activé</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-3.5">
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
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Ajouter un employé</p>
            <p className="mb-4 text-xs text-ardoise-500">
              Définis un mot de passe initial à transmettre à la personne — elle devra le personnaliser à sa
              première connexion.
            </p>
            <UserForm />
          </div>
        ) : (
          <div className="card">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Inviter un utilisateur</p>
            <p className="text-sm text-ardoise-500">
              Seul le compte Administrateur peut créer ou inviter de nouveaux comptes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
