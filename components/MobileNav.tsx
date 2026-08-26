"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { NAV_ITEMS } from "@/lib/nav-items";
import Logo from "@/components/Logo";

/**
 * Menu de navigation mobile (bouton "menu" + volet déroulant).
 * Le volet est rendu via un portail dans <body> : le <header> parent a un
 * backdrop-blur, qui crée un nouveau containing block CSS pour les éléments
 * `position: fixed` descendants (comme le ferait `transform`) — sans
 * portail, le volet se retrouvait ancré à la boîte (courte) du header au
 * lieu du viewport, avec son contenu qui débordait par-dessus la page.
 */
export default function MobileNav({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role));

  // Pas de garde "monté côté client" : `open` démarre à `false` et ne peut
  // devenir vrai que via un clic (donc déjà côté client), `document.body`
  // est donc toujours disponible au moment où le portail est utilisé.

  // Ouverture en deux temps : on monte d'abord le volet hors-écran, puis on
  // déclenche la transition CSS vers sa position finale au tick suivant.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, [open]);

  function close() {
    setVisible(false);
    setTimeout(() => setOpen(false), 300);
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu"
        className="flex items-center justify-center rounded border border-ardoise-300 bg-white p-2.5 text-ardoise-700 transition-colors duration-300 ease-premium hover:border-faraday-700"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block h-px w-4 bg-ardoise-700" />
          <span className="block h-px w-4 bg-ardoise-700" />
          <span className="block h-px w-4 bg-ardoise-700" />
        </span>
      </button>

      {open &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 z-40 bg-ardoise-900/40 backdrop-blur-[2px] transition-opacity duration-300 ease-premium ${
                visible ? "opacity-100" : "opacity-0"
              }`}
              onClick={close}
            />
            <nav
              className={`fixed left-0 top-0 z-50 h-full w-72 bg-white px-6 py-8 shadow-xl transition-transform duration-300 ease-premium ${
                visible ? "translate-x-0" : "-translate-x-full"
              }`}
            >
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
                        onClick={close}
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
          </>,
          document.body
        )}
    </div>
  );
}
