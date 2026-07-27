import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE, getOffer, formatEuro } from "@/lib/site-content";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const offer = getOffer(id);
  return { title: offer ? `${offer.name} — ${SITE.name}` : `Offre — ${SITE.name}` };
}

function nextRenewal(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function OffreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = getOffer(id);
  if (!offer) notFound();

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <Link href="/offres" className="text-sm text-faraday-700 hover:underline">← Toutes les offres</Link>

      <div className="mt-4 grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <h1 className="text-3xl font-semibold tracking-tight text-ardoise-900">Offre {offer.name}</h1>
          <p className="mt-2 text-ardoise-600">{offer.tagline}</p>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ardoise-400">Inclus dans l&apos;offre</h2>
          <ul className="mt-3 space-y-2 text-sm text-ardoise-700">
            {offer.features.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-faraday-600">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-ardoise-400">Conditions</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-ardoise-600">
            <li>• Facturation mensuelle, {offer.support.toLowerCase()}.</li>
            <li>• {offer.maxUsers ? `Jusqu'à ${offer.maxUsers} utilisateurs.` : "Nombre d'employés illimité."}</li>
            <li>• Renouvellement automatique chaque mois.</li>
            <li>• Résiliation à tout moment ; accès conservé jusqu&apos;à la fin de la période payée.</li>
          </ul>
        </div>

        {/* Récapitulatif */}
        <aside className="md:col-span-2">
          <div className="rounded-2xl border border-ardoise-100 bg-white p-6 shadow-sm">
            <p className="text-4xl font-semibold tracking-tight text-ardoise-900">
              {formatEuro(offer.priceCents)}
              <span className="text-base font-normal text-ardoise-400"> / {offer.period}</span>
            </p>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ardoise-500">À payer aujourd&apos;hui</dt><dd className="font-medium text-ardoise-900">{formatEuro(offer.priceCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-ardoise-500">Facturation</dt><dd className="text-ardoise-700">Mensuelle</dd></div>
              <div className="flex justify-between"><dt className="text-ardoise-500">Prochain renouvellement</dt><dd className="text-ardoise-700">{nextRenewal()}</dd></div>
            </dl>
            <Link href={`/inscription?offre=${offer.id}`} className="btn-primary mt-6 w-full">
              Continuer vers l&apos;inscription
            </Link>
            <p className="mt-3 text-center text-xs text-ardoise-400">Paiement sécurisé. Sans engagement.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
