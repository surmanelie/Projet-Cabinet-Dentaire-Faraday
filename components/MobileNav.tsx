"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { NAV_ITEMS } from "@/lib/nav-items";

/** Menu de navigation mobile (bouton "menu" + volet déroulant). */
export default function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        className="flex items-center gap-2 rounded-lg border border-ardoise-200 px-3 py-1.5 text-sm font-medium text-ardoise-700"
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
            <div className="mb-6 flex items-center gap-2 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-faraday-600 text-sm font-semibold text-white">
                CF
              </div>
              <p className="text-sm font-semibold text-ardoise-900">FaradayBoard</p>
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
