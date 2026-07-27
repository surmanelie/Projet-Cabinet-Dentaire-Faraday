import type { Metadata } from "next";
import { SITE, OFFERS, formatEuro } from "@/lib/site-content";

export const metadata: Metadata = { title: `Conditions générales — ${SITE.name}`, robots: { index: false } };

export default function ConditionsGeneralesPage() {
  const offer = OFFERS[0];
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ardoise-900">Conditions générales</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-ardoise-700">
        <p><span className="font-medium">Objet :</span> {SITE.name} fournit un service en ligne de gestion du temps de travail par abonnement.</p>
        <p><span className="font-medium">Abonnement :</span> l&apos;offre {offer.name} est facturée {formatEuro(offer.priceCents)} par {offer.period}, renouvelée automatiquement.</p>
        <p><span className="font-medium">Résiliation :</span> possible à tout moment ; l&apos;accès reste actif jusqu&apos;à la fin de la période déjà réglée. Aucune donnée n&apos;est supprimée immédiatement.</p>
        <p><span className="font-medium">Disponibilité :</span> le service est fourni « en l&apos;état » ; nous nous efforçons d&apos;en assurer la continuité.</p>
        <p className="text-ardoise-400">Texte provisoire à faire valider juridiquement avant mise en production.</p>
      </div>
    </section>
  );
}
