import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Paiement annulé", robots: { index: false } };

export default function PaiementAnnulePage() {
  return (
    <section className="mx-auto max-w-md px-4 py-24 text-center md:px-6">
      <div className="text-6xl">↩️</div>
      <h1 className="mt-4 text-2xl font-semibold text-ardoise-900">Paiement annulé</h1>
      <p className="mt-3 text-ardoise-600">
        Aucun montant n&apos;a été prélevé et aucun abonnement n&apos;a été activé. Vous pouvez réessayer quand vous
        le souhaitez.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/offres" className="btn-primary">Revoir les offres</Link>
        <Link href="/" className="btn-secondary">Retour à l&apos;accueil</Link>
      </div>
    </section>
  );
}
