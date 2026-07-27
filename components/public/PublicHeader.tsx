"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { SITE } from "@/lib/site-content";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/fonctionnement", label: "Fonctionnement" },
  { href: "/offres", label: "Nos offres" },
  { href: "/qui-sommes-nous", label: "Qui sommes-nous ?" },
];

export default function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ardoise-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={SITE.name}>
          <LogoMark size={34} />
          <span className="text-lg font-semibold tracking-tight text-ardoise-900">{SITE.name}</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-ardoise-600 transition hover:text-faraday-700">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn-secondary">Connexion</Link>
          <Link href="/offres" className="btn-primary">S&apos;abonner</Link>
        </div>

        <button
          className="ml-auto rounded-xl border border-ardoise-200 px-3 py-2 text-sm font-medium text-ardoise-700 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="border-t border-ardoise-100 bg-white md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-medium text-ardoise-700 hover:bg-ardoise-50">
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary flex-1">Connexion</Link>
              <Link href="/offres" onClick={() => setOpen(false)} className="btn-primary flex-1">S&apos;abonner</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
