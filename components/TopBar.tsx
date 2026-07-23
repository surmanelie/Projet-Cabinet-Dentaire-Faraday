import { logoutAction } from "@/lib/actions/auth";
import NotificationBell from "./NotificationBell";
import MobileNav from "./MobileNav";
import type { SessionUser } from "@/types";

type Notif = { id: string; title: string; message: string; link: string | null; createdAt: Date };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  RH: "RH / Responsable",
  PRATICIEN: "Praticien",
  ASSISTANT: "Employé",
  COMPTABLE: "Comptable",
};

export default function TopBar({ user, notifications }: { user: SessionUser; notifications: Notif[] }) {
  return (
    <header className="flex items-center justify-between border-b border-ardoise-100 bg-white px-4 py-3 md:px-6">
      <MobileNav role={user.role} />
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell notifications={notifications} />
        <div className="text-right">
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
          <button type="submit" className="btn-secondary text-xs">
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
