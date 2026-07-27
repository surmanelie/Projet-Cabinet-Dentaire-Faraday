import type { Metadata } from "next";
import { SITE } from "@/lib/site-content";

export const metadata: Metadata = { title: `Mentions légales — ${SITE.name}`, robots: { index: false } };

export default function MentionsLegalesPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ardoise-900">Mentions légales</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-ardoise-700">
        <p><span className="font-medium">Éditeur :</span> [À compléter — nom / raison sociale, statut, SIRET].</p>
        <p><span className="font-medium">Responsable de la publication :</span> [À compléter].</p>
        <p><span className="font-medium">Hébergement :</span> [À compléter — hébergeur, adresse].</p>
        <p><span className="font-medium">Contact :</span> {SITE.contact.email}</p>
        <p className="text-ardoise-400">Ce texte est provisoire et doit être complété avec vos informations légales réelles.</p>
      </div>
    </section>
  );
}
