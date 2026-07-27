import { logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { isAdminOrRh } from "@/lib/permissions";
import NotificationBell from "./NotificationBell";
import MobileNav from "./MobileNav";
import SearchBar from "./SearchBar";
import type { SessionUser } from "@/types";

type Notif = { id: string; title: string; message: string; link: string | null; createdAt: Date };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RH: "RH / Responsable",
  PRATICIEN: "Praticien",
  ASSISTANT: "Employé",
  COMPTABLE: "Comptable",
};

export default async function TopBar({ user, notifications }: { user: SessionUser; notifications: Notif[] }) {
  const people = isAdminOrRh(user.role)
    ? await prisma.user.findMany({
        where: { active: true, role: { in: ["ASSISTANT", "PRATICIEN"] } },
        select: { id: true, firstName: true, lastName: true, color: true },
        orderBy: { lastName: "asc" },
      })
    : [];

  return (
    <header className="flex items-center gap-3 border-b border-ardoise-100 bg-white px-4 py-3 md:px-6">
      <MobileNav role={user.role} />
      {people.length > 0 && <SearchBar people={people} />}

      <div className="ml-auto flex items-center gap-3">
        <NotificationBell notifications={notifications} />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ardoise-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-ardoise-400">{ROLE_LABELS[user.role] ?? user.role}</p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: user.color }}
        >
          {user.firstName[0]}
          {user.lastName[0]}
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-secondary px-3 py-2 text-xs">
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
