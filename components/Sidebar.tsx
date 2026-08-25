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
    <nav className="hidden w-64 shrink-0 flex-col border-r border-ardoise-200 bg-white/80 px-5 py-8 md:flex">
      <div className="mb-10 px-1">
        <Logo subtitle="Cabinet Faraday" />
      </div>
      <ul className="flex flex-1 flex-col gap-0.5">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block border-l-2 py-2.5 pl-4 text-[13px] font-medium uppercase tracking-wide transition-all duration-300 ease-premium ${
                  active
                    ? "border-faraday-700 text-ardoise-900"
                    : "border-transparent text-ardoise-500 hover:border-ardoise-300 hover:text-ardoise-800"
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
