import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OFFERS, formatEuro } from "@/lib/site-content";

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default async function PlatformDashboard() {
  const monthStart = startOfMonth();
  const price = OFFERS[0].priceCents;

  const [
    totalCompanies,
    activeCompanies,
    pendingCompanies,
    suspendedCompanies,
    canceledCompanies,
    newThisMonth,
    freeCompanies,
    totalUsers,
    activePaidSubs,
    recent,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.company.count({ where: { status: "PENDING" } }),
    prisma.company.count({ where: { status: "SUSPENDED" } }),
    prisma.company.count({ where: { status: "CANCELED" } }),
    prisma.company.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.company.count({ where: { accessType: "FREE" } }),
    prisma.user.count({ where: { role: { not: "SUPER_ADMIN" }, companyId: { not: null } } }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.company.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, name: true, status: true, accessType: true, createdAt: true } }),
  ]);

  const mrr = activePaidSubs * price;

  const kpis = [
    { label: "Entreprises", value: totalCompanies },
    { label: "Actives", value: activeCompanies, tone: "text-faraday-300" },
    { label: "En attente de paiement", value: pendingCompanies, tone: "text-amber-300" },
    { label: "Suspendues", value: suspendedCompanies, tone: "text-red-300" },
    { label: "Résiliées", value: canceledCompanies, tone: "text-ardoise-300" },
    { label: "Nouvelles ce mois", value: newThisMonth },
    { label: "Passes gratuits", value: freeCompanies, tone: "text-faraday-300" },
    { label: "Utilisateurs (clients)", value: totalUsers },
    { label: "Abonnements payants actifs", value: activePaidSubs, tone: "text-faraday-300" },
    { label: "Revenu mensuel estimé (MRR)", value: formatEuro(mrr) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Tableau de bord</h1>
        <Link href="/platform-admin/entreprises/nouvelle" className="rounded-xl bg-faraday-500 px-4 py-2 text-sm font-medium text-white hover:bg-faraday-600">
          + Créer une entreprise (gratuite)
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className={`text-2xl font-semibold ${k.tone ?? "text-white"}`}>{k.value}</p>
            <p className="mt-1 text-xs text-ardoise-400">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Dernières entreprises</h2>
          <Link href="/platform-admin/entreprises" className="text-sm text-faraday-300 hover:underline">Voir toutes →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-ardoise-400">Aucune entreprise pour le moment.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {recent.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5">
                <Link href={`/platform-admin/entreprises/${c.id}`} className="text-sm font-medium text-white hover:underline">
                  {c.name}
                </Link>
                <span className="flex items-center gap-2 text-xs text-ardoise-400">
                  {c.accessType === "FREE" && <span className="rounded bg-faraday-500/20 px-1.5 py-0.5 text-faraday-300">Offert</span>}
                  <span>{c.status}</span>
                  <span>{c.createdAt.toLocaleDateString("fr-FR")}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
