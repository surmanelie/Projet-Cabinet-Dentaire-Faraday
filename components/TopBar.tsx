import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { isAdminOrRh } from "@/lib/permissions";
import NotificationBell from "./NotificationBell";
import MobileNav from "./MobileNav";
import SearchBar from "./SearchBar";
import Logo from "./Logo";
import type { SessionUser } from "@/types";

type Notif = { id: string; title: string; message: string; link: string | null; createdAt: Date };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RH: "RH / Responsable",
  PRATICIEN: "Praticien",
  ASSISTANT: "Assistante",
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
    <header className="flex items-center gap-4 border-b border-ardoise-200 bg-white/80 px-5 py-4 backdrop-blur-sm md:px-8">
      <MobileNav role={user.role} />
      <Link href="/" className="hidden sm:block">
        <Logo showName />
      </Link>
      <div className="ml-2 hidden lg:block">{people.length > 0 && <SearchBar people={people} />}</div>

      <div className="ml-auto flex items-center gap-4">
        <NotificationBell notifications={notifications} />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ardoise-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider2 text-ardoise-400">
            {ROLE_LABELS[user.role] ?? user.role}
          </p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium text-white"
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
