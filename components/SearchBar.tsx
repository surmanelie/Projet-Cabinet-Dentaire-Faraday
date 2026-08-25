"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Person = { id: string; firstName: string; lastName: string; color: string };

/** Recherche rapide d'un employé → ouvre son agenda. */
export default function SearchBar({ people }: { people: Person[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const results = q.trim()
    ? people
        .filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  function go(id: string) {
    setQ("");
    setOpen(false);
    router.push(`/planning?user=${id}`);
  }

  return (
    <div className="relative hidden w-72 sm:block">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ardoise-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
      </span>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Rechercher un employé…"
        className="w-full rounded border border-ardoise-300 bg-white py-2 pl-9 pr-3 text-sm text-ardoise-800 transition-all duration-200 ease-premium placeholder:text-ardoise-400 focus:border-faraday-700 focus:outline-none focus:ring-1 focus:ring-faraday-700/30"
      />
      {open && results.length > 0 && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded border border-ardoise-200 bg-white shadow-lg">
          {results.map((p) => (
            <button
              key={p.id}
              onMouseDown={(e) => {
                e.preventDefault();
                go(p.id);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-ardoise-50"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.firstName[0]}{p.lastName[0]}
              </span>
              <span className="text-ardoise-800">{p.firstName} {p.lastName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
