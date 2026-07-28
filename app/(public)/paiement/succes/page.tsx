import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Paiement confirmé", robots: { index: false } };

export default function PaiementSuccesPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-24 text-center md:px-6">
      <div className="text-6xl">✅</div>
      <h1 className="mt-4 text-2xl font-semibold text-ardoise-900">Merci, votre paiement est confirmé</h1>
      <p className="mt-3 text-ardoise-600">
        Votre abonnement est en cours d&apos;activation et l&apos;environnement de votre entreprise est en train
        d&apos;être créé. Vous pouvez dès à présent vous connecter avec l&apos;e-mail et le mot de passe choisis à
        l&apos;inscription.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/login" className="btn-primary">Se connecter</Link>
        <Link href="/" className="btn-secondary">Retour à l&apos;accueil</Link>
      </div>
      <p className="mt-6 text-xs text-ardoise-400">
        Si la connexion ne fonctionne pas immédiatement, patientez une minute : l&apos;activation se fait juste après
        la confirmation du paiement.
      </p>
    </section>
  );
}
