import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OFFERS, formatEuro } from "@/lib/site-content";
import CompanyActions from "./CompanyActions";

function fmt(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // On ne récupère QUE les champs administratifs — jamais les données privées
  // des environnements (messages, pointages, etc.).
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      subscription: true,
      users: { select: { id: true, firstName: true, lastName: true, email: true, role: true, active: true, createdAt: true } },
    },
  });
  if (!company) notFound();

  const offer = OFFERS.find((o) => o.id === company.offerId) ?? OFFERS[0];
  const sub = company.subscription;

  return (
    <div className="space-y-6">
      <Link href="/platform-admin/entreprises" className="text-sm text-faraday-300 hover:underline">← Toutes les entreprises</Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{company.name}</h1>
          <p className="text-sm text-ardoise-400">Créée le {fmt(company.createdAt)} · ID {company.id}</p>
        </div>
        <span className="rounded-lg bg-white/10 px-3 py-1 text-sm text-white">
          {company.status}{company.accessType === "FREE" ? " · Offert" : ""}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Abonnement */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-medium text-white">Abonnement</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Type d'accès" value={company.accessType === "FREE" ? "Passe offert (sans carte)" : "Abonnement payant"} />
            <Row label="Offre" value={offer.name} />
            <Row label="Tarif normal" value={`${formatEuro(offer.priceCents)} / mois`} />
            {company.accessType === "FREE" && <Row label="Gratuité jusqu'au" value={company.freeUntil ? fmt(company.freeUntil) : "Permanente"} />}
            {sub && <>
              <Row label="Statut Stripe" value={sub.status} />
              <Row label="Période en cours" value={`${fmt(sub.currentPeriodStart)} → ${fmt(sub.currentPeriodEnd)}`} />
              <Row label="Renouvellement" value={sub.cancelAtPeriodEnd ? "Résiliation programmée en fin de période" : "Automatique"} />
              <Row label="ID abonnement" value={sub.stripeSubscriptionId} />
            </>}
            {company.stripeCustomerId && <Row label="ID client Stripe" value={company.stripeCustomerId} />}
          </dl>
        </div>

        {/* Coordonnées */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-3 text-sm font-medium text-white">Coordonnées administratives</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Responsable" value={company.pendingAdminEmail ?? company.users.find((u) => u.role === "ADMIN")?.email ?? "—"} />
            <Row label="Téléphone" value={company.phone ?? "—"} />
            <Row label="Adresse" value={[company.address, company.zip, company.city, company.country].filter(Boolean).join(", ") || "—"} />
            <Row label="N° TVA" value={company.vat ?? "—"} />
            <Row label="Salariés déclarés" value={company.employeesCount?.toString() ?? "—"} />
          </dl>
        </div>
      </div>

      {/* Utilisateurs (champs administratifs uniquement) */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-medium text-white">Utilisateurs ({company.users.length})</h2>
        {company.users.length === 0 ? (
          <p className="text-sm text-ardoise-400">Aucun utilisateur (compte en attente d&apos;activation).</p>
        ) : (
          <ul className="divide-y divide-white/10 text-sm">
            {company.users.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2">
                <span className="text-white">{u.firstName} {u.lastName} <span className="text-ardoise-400">· {u.email}</span></span>
                <span className="text-xs text-ardoise-400">{u.role} · {u.active ? "actif" : "inactif"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-medium text-white">Actions administratives</h2>
        <CompanyActions
          companyId={company.id}
          companyName={company.name}
          status={company.status}
          note={company.internalNotes ?? ""}
          hasSubscription={Boolean(sub)}
        />
      </div>

      <p className="text-xs text-ardoise-500">
        Confidentialité : cette fiche n&apos;affiche que des informations administratives. Les données privées des
        environnements (messages, pointages, documents) ne sont jamais chargées ici.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ardoise-400">{label}</dt>
      <dd className="text-right text-ardoise-100">{value}</dd>
    </div>
  );
}
