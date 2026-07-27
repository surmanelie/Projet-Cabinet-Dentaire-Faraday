import type { Metadata } from "next";
import { SITE } from "@/lib/site-content";

export const metadata: Metadata = { title: `Confidentialité — ${SITE.name}`, robots: { index: false } };

export default function ConfidentialitePage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ardoise-900">Politique de confidentialité</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-ardoise-700">
        <p>{SITE.name} traite des données personnelles (identité, coordonnées, horaires de travail) dans le cadre de la gestion du temps de vos équipes.</p>
        <p><span className="font-medium">Finalités :</span> fourniture du service, gestion des comptes et de la facturation.</p>
        <p><span className="font-medium">Conservation :</span> les données sont conservées pendant la durée de l&apos;abonnement puis selon les obligations légales.</p>
        <p><span className="font-medium">Vos droits :</span> accès, rectification, effacement et portabilité, en écrivant à {SITE.contact.email}.</p>
        <p><span className="font-medium">Paiement :</span> les données bancaires sont traitées par notre prestataire de paiement et ne transitent jamais par nos serveurs.</p>
        <p className="text-ardoise-400">Texte provisoire à faire valider juridiquement (RGPD) avant mise en production.</p>
      </div>
    </section>
  );
}
