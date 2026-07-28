import Link from "next/link";
import FreeCompanyForm from "./FreeCompanyForm";

export default function NouvelleEntreprisePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/platform-admin/entreprises" className="text-sm text-faraday-300 hover:underline">← Retour</Link>
      <h1 className="text-2xl font-semibold text-white">Créer une entreprise (accès offert)</h1>
      <p className="text-sm text-ardoise-400">
        Pour un proche, un partenaire, un client pilote ou une démo. L&apos;entreprise est activée immédiatement avec
        un passe gratuit — aucune carte, aucun prélèvement.
      </p>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <FreeCompanyForm />
      </div>
    </div>
  );
}
