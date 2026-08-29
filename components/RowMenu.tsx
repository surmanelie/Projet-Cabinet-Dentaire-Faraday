"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Menu contextuel générique déclenché par un bouton « ⋯ » — réutilisable
 * pour n'importe quelle ligne de tableau/liste, pas spécifique aux
 * assistantes. Se ferme au clic extérieur ou à la touche Échap ; les
 * actions qu'il contient (ex. une action qui ouvre sa propre modale)
 * restent montées tant que l'utilisateur ne referme pas explicitement
 * le menu, pour ne jamais démonter une modale enfant en cours d'usage.
 */
export default function RowMenu({
  children,
  label = "Actions",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded text-ardoise-500 transition-colors duration-200 ease-premium hover:bg-ardoise-100 hover:text-ardoise-900"
      >
        <span aria-hidden="true" className="text-lg leading-none">⋯</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[220px] rounded-lg border border-ardoise-200 bg-white p-1.5 shadow-lg"
        >
          <div className="flex flex-col gap-0.5">{children}</div>
        </div>
      )}
    </div>
  );
}
