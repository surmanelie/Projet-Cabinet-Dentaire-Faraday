import type { Metadata } from "next";
import Link from "next/link";
import { SITE, STEPS, OFFERS, formatEuro } from "@/lib/site-content";

export const metadata: Metadata = {
  title: `${SITE.name} — Gestion du temps de vos équipes`,
  description: SITE.hero.subtitle,
  openGraph: { title: SITE.name, description: SITE.hero.subtitle, type: "website" },
};

export default function LandingPage() {
  const offer = OFFERS[0];

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-16 md:px-6 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-faraday-50 px-3 py-1 text-xs font-medium text-faraday-700">
            Pointage · Horaires · Congés
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ardoise-900 md:text-5xl">
            {SITE.hero.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ardoise-600">{SITE.hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/fonctionnement" className="btn-secondary">Découvrir le fonctionnement</Link>
            <Link href="/offres" className="btn-primary">Voir nos offres</Link>
          </div>
        </div>
      </section>

      {/* Valeur */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {SITE.valueProps.map((v) => (
            <div key={v.title} className="rounded-2xl border border-ardoise-100 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-ardoise-900">{v.title}</h3>
              <p className="mt-2 text-sm text-ardoise-600">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Étapes */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-ardoise-900 md:text-3xl">Comment ça marche&nbsp;?</h2>
          <p className="mt-2 text-ardoise-600">De l&apos;inscription à la gestion quotidienne, en quelques minutes.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-ardoise-100 bg-white p-6 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-faraday-600 text-sm font-semibold text-white">
                {s.n}
              </span>
              <h3 className="mt-3 font-semibold text-ardoise-900">{s.title}</h3>
              <p className="mt-1 text-sm text-ardoise-600">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/fonctionnement" className="btn-secondary">En savoir plus</Link>
        </div>
      </section>

      {/* Offre mise en avant */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="mx-auto max-w-md rounded-3xl border-2 border-faraday-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-ardoise-900">{offer.name}</h2>
          <p className="mt-1 text-sm text-ardoise-500">{offer.tagline}</p>
          <p className="mt-5 text-4xl font-semibold tracking-tight text-ardoise-900">
            {formatEuro(offer.priceCents)}
            <span className="text-base font-normal text-ardoise-400"> / {offer.period}</span>
          </p>
          <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm text-ardoise-600">
            {offer.features.slice(0, 5).map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-faraday-600">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link href={`/offres/${offer.id}`} className="btn-primary mt-7 w-full">S&apos;abonner</Link>
          <p className="mt-3 text-xs text-ardoise-400">Sans engagement — résiliable à tout moment.</p>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="rounded-3xl bg-faraday-700 px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-semibold md:text-3xl">Prêt à simplifier la gestion de votre équipe&nbsp;?</h2>
          <p className="mx-auto mt-3 max-w-xl text-faraday-50">
            Créez l&apos;environnement de votre entreprise en quelques minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/offres" className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-faraday-800 shadow-sm transition hover:bg-faraday-50">
              Commencer
            </Link>
            <Link href="/login" className="rounded-xl border border-white/40 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
