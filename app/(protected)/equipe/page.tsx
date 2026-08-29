import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import SectionLabel from "@/components/SectionLabel";
import RowMenu from "@/components/RowMenu";
import ToggleActiveButton from "./ToggleActiveButton";
import ResendInviteButton from "./ResendInviteButton";
import EditUserModal from "./EditUserModal";
import DeleteUserButton from "./DeleteUserButton";
import AddUserModal from "./AddUserModal";

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Équipe</SectionLabel>
          <h1 className="mt-3 page-title">Employés</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/equipe/heures" className="btn-ghost">
            Suivi des heures <span aria-hidden="true">→</span>
          </Link>
          {isAdmin && <AddUserModal />}
        </div>
      </div>

      {!isAdmin && (
        <p className="text-sm text-ardoise-500">
          Seul le compte Administrateur peut créer, modifier ou désactiver des comptes.
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ardoise-200 text-left text-[11px] uppercase tracking-wider2 text-ardoise-400">
              <th className="pb-3">Nom</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Rôle</th>
              <th className="pb-3">Statut</th>
              <th className="pb-3">Compte</th>
              {isAdmin && <th className="pb-3 text-right">Action</th>}
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
                  {u.assistantProfile && (
                    <span className="ml-2 text-xs font-semibold text-faraday-600">
                      {u.assistantProfile.weeklyContractHours} h / semaine
                    </span>
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
                  <td className="py-3.5 text-right">
                    <RowMenu label={`Actions pour ${u.firstName} ${u.lastName}`}>
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
                      <div className="my-1 border-t border-ardoise-100" />
                      <DeleteUserButton userId={u.id} userName={`${u.firstName} ${u.lastName}`} />
                    </RowMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
