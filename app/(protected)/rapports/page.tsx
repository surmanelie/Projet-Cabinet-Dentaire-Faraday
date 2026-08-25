import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import SectionLabel from "@/components/SectionLabel";

export default async function RapportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <SectionLabel>Rapports</SectionLabel>
        <h1 className="mt-3 font-serif text-4xl italic text-ardoise-900">Rapports &amp; exports</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/rapports/pdf" className="card transition-colors hover:border-faraday-300">
          <p className="text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Exports PDF</p>
          <p className="mt-2 text-sm text-ardoise-500">
            Récapitulatif mensuel individuel ou synthèse comptable globale.
          </p>
        </Link>
        <Link href="/rapports/csv" className="card transition-colors hover:border-faraday-300">
          <p className="text-[11px] font-semibold uppercase tracking-wider2 text-ardoise-400">Export CSV</p>
          <p className="mt-2 text-sm text-ardoise-500">Export comptable au format CSV (compatible Excel).</p>
        </Link>
      </div>
    </div>
  );
}
