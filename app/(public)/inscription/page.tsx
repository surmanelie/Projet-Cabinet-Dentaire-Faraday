import type { Metadata } from "next";
import Link from "next/link";
import { SITE, getOffer, OFFERS, formatEuro } from "@/lib/site-content";
import InscriptionForm from "./InscriptionForm";

export const metadata: Metadata = {
  title: `Inscription — ${SITE.name}`,
  robots: { index: false },
};

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ offre?: string }>;
}) {
  const { offre } = await searchParams;
  const offer = getOffer(offre ?? "") ?? OFFERS[0];

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 md:px-6">
      <div className="mb-6">
        <Link href={`/offres/${offer.id}`} className="text-sm text-faraday-700 hover:underline">← Retour à l&apos;offre</Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ardoise-900">Créer votre compte entreprise</h1>
        <p className="mt-2 text-ardoise-600">
          Offre <span className="font-medium text-ardoise-800">{offer.name}</span> — {formatEuro(offer.priceCents)} / {offer.period}.
        </p>
      </div>

      <div className="card">
        <InscriptionForm offerId={offer.id} offerName={offer.name} price={formatEuro(offer.priceCents)} />
      </div>
    </section>
  );
}
