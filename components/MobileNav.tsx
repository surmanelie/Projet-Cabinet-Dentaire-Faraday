"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { NAV_ITEMS } from "@/lib/nav-items";
import Logo from "@/components/Logo";

/** Menu de navigation mobile (bouton "menu" + volet déroulant). */
export default function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        className="flex items-center gap-2 rounded-xl border border-ardoise-200 bg-white px-3 py-2 text-sm font-medium text-ardoise-700 shadow-sm transition hover:bg-ardoise-50"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block h-0.5 w-4 bg-ardoise-700" />
          <span className="block h-0.5 w-4 bg-ardoise-700" />
          <span className="block h-0.5 w-4 bg-ardoise-700" />
        </span>
        Menu
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <nav className="fixed left-0 top-0 z-50 h-full w-64 bg-white p-4 shadow-xl">
            <div className="mb-6 px-2">
              <Logo subtitle="Cabinet Faraday" />
            </div>
            <ul className="flex flex-col gap-1">
              {items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active ? "bg-faraday-50 text-faraday-700" : "text-ardoise-600 hover:bg-ardoise-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
