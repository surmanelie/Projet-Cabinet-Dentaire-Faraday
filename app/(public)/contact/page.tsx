import type { Metadata } from "next";
import { SITE } from "@/lib/site-content";

export const metadata: Metadata = {
  title: `Contact — ${SITE.name}`,
  description: "Contactez l'équipe Surmaly.",
};

export default function ContactPage() {
  const { contact } = SITE;
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ardoise-900 md:text-4xl">Contact</h1>
      <p className="mt-3 text-ardoise-600">Une question sur {SITE.name} ou votre abonnement&nbsp;? Écrivez-nous.</p>

      <div className="mt-8 space-y-3 rounded-2xl border border-ardoise-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-ardoise-700">
          <span className="font-medium text-ardoise-900">E-mail :</span>{" "}
          <a href={`mailto:${contact.email}`} className="text-faraday-700 hover:underline">{contact.email}</a>
        </p>
        {contact.phone && (
          <p className="text-sm text-ardoise-700"><span className="font-medium text-ardoise-900">Téléphone :</span> {contact.phone}</p>
        )}
        {contact.address && (
          <p className="text-sm text-ardoise-700"><span className="font-medium text-ardoise-900">Adresse :</span> {contact.address}</p>
        )}
      </div>
    </section>
  );
}
