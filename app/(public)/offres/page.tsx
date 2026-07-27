import type { Metadata } from "next";
import Link from "next/link";
import { SITE, OFFERS, formatEuro } from "@/lib/site-content";

export const metadata: Metadata = {
  title: `Nos offres — ${SITE.name}`,
  description: "Découvrez nos formules d'abonnement mensuel pour la gestion du temps de vos équipes.",
};

export default function OffresPage() {
  const offers = OFFERS.filter((o) => o.active);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ardoise-900 md:text-4xl">Nos offres</h1>
        <p className="mt-3 text-ardoise-600">
          Un abonnement mensuel simple, sans engagement. Chaque entreprise dispose de son environnement privé.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className={`flex flex-col rounded-3xl bg-white p-8 shadow-sm ${
              offer.highlighted ? "border-2 border-faraday-300" : "border border-ardoise-100"
            }`}
          >
            {offer.highlighted && (
              <span className="mb-3 inline-block w-fit rounded-full bg-faraday-50 px-3 py-1 text-xs font-medium text-faraday-700">
                Recommandé
              </span>
            )}
            <h2 className="text-xl font-semibold text-ardoise-900">{offer.name}</h2>
            <p className="mt-1 text-sm text-ardoise-500">{offer.tagline}</p>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-ardoise-900">
              {formatEuro(offer.priceCents)}
              <span className="text-base font-normal text-ardoise-400"> / {offer.period}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-ardoise-600">
              {offer.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-faraday-600">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href={`/offres/${offer.id}`} className="btn-primary mt-7 w-full">
              S&apos;abonner
            </Link>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-ardoise-400">
        Renouvellement automatique chaque mois. Résiliation possible à tout moment ; l&apos;accès reste actif
        jusqu&apos;à la fin de la période déjà réglée.
      </p>
    </section>
  );
}
