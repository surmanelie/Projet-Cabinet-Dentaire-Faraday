"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

type NavItem = { href: string; label: string; roles: Role[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", roles: ["ADMIN", "RH"] },
  { href: "/mon-espace", label: "Mon espace", roles: ["ASSISTANT"] },
  { href: "/pointage", label: "Pointer", roles: ["ASSISTANT"] },
  { href: "/mes-horaires", label: "Mes horaires", roles: ["ASSISTANT"] },
  { href: "/espace-praticien", label: "Mon équipe", roles: ["PRATICIEN"] },
  { href: "/planning", label: "Planning", roles: ["ADMIN", "RH", "PRATICIEN"] },
  { href: "/equipe", label: "Équipe", roles: ["ADMIN", "RH"] },
  { href: "/equipe/pointage", label: "Pointage QR", roles: ["ADMIN", "RH"] },
  { href: "/absences", label: "Absences", roles: ["ADMIN", "RH", "ASSISTANT", "PRATICIEN"] },
  { href: "/validations", label: "Validations", roles: ["ADMIN", "RH", "ASSISTANT", "COMPTABLE"] },
  { href: "/rapports", label: "Rapports", roles: ["ADMIN", "RH", "COMPTABLE"] },
  { href: "/parametres", label: "Paramètres", roles: ["ADMIN", "RH"] },
  { href: "/audit", label: "Journal d'audit", roles: ["ADMIN"] },
  { href: "/aide", label: "Aide", roles: ["ADMIN", "RH", "PRATICIEN", "ASSISTANT", "COMPTABLE"] },
];

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));

  return (
    <nav className="hidden w-60 flex-col border-r border-ardoise-100 bg-white p-4 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-faraday-600 text-sm font-semibold text-white">
          CF
        </div>
        <div>
          <p className="text-sm font-semibold text-ardoise-900">FaradayBoard</p>
          <p className="text-xs text-ardoise-400">Cabinet Faraday</p>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-faraday-50 text-faraday-700"
                    : "text-ardoise-600 hover:bg-ardoise-50"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
