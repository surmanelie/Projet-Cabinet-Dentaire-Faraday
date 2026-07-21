import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RapportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-ardoise-900">Rapports &amp; exports</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/rapports/pdf" className="card hover:border-faraday-300 hover:shadow-md transition">
          <h2 className="font-semibold text-ardoise-900">Exports PDF</h2>
          <p className="mt-1 text-sm text-ardoise-500">
            Récapitulatif mensuel individuel ou synthèse comptable globale.
          </p>
        </Link>
        <Link href="/rapports/csv" className="card hover:border-faraday-300 hover:shadow-md transition">
          <h2 className="font-semibold text-ardoise-900">Export CSV</h2>
          <p className="mt-1 text-sm text-ardoise-500">Export comptable au format CSV (compatible Excel).</p>
        </Link>
      </div>
    </div>
  );
}
