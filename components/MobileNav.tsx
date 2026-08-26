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
        className="flex items-center justify-center rounded border border-ardoise-300 bg-white p-2.5 text-ardoise-700 transition-colors duration-300 ease-premium hover:border-faraday-700"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block h-px w-4 bg-ardoise-700" />
          <span className="block h-px w-4 bg-ardoise-700" />
          <span className="block h-px w-4 bg-ardoise-700" />
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ardoise-900/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed left-0 top-0 z-50 h-full w-72 bg-white px-6 py-8 shadow-xl">
            <div className="mb-10 px-1">
              <Logo subtitle="Cabinet Faraday" />
            </div>
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
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
        </>
      )}
    </div>
  );
}
