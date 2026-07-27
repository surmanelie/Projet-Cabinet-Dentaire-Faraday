import type { Metadata } from "next";
import Link from "next/link";
import { SITE, STEPS } from "@/lib/site-content";

export const metadata: Metadata = {
  title: `Fonctionnement — ${SITE.name}`,
  description: "Comment fonctionne Surmaly : de l'inscription à la gestion quotidienne des heures de vos équipes.",
};

export default function FonctionnementPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ardoise-900 md:text-4xl">Comment ça fonctionne</h1>
        <p className="mt-3 text-ardoise-600">Un parcours simple, pensé pour les entreprises qui emploient plusieurs salariés.</p>
      </div>

      <ol className="mt-10 space-y-4">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-4 rounded-2xl border border-ardoise-100 bg-white p-6 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-faraday-600 text-base font-semibold text-white">
              {s.n}
            </span>
            <div>
              <h2 className="font-semibold text-ardoise-900">{s.title}</h2>
              <p className="mt-1 text-sm text-ardoise-600">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 text-center">
        <Link href="/offres" className="btn-primary">Voir nos offres</Link>
      </div>
    </section>
  );
}
