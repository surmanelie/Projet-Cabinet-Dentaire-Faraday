"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { NAV_ITEMS } from "@/lib/nav-items";
import Logo from "@/components/Logo";

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));

  return (
    <nav className="hidden w-60 flex-col border-r border-ardoise-100 bg-white p-4 md:flex">
      <div className="mb-6 px-2">
        <Logo subtitle="Cabinet Faraday" />
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
