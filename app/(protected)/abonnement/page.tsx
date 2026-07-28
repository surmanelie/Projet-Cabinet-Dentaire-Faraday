import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OFFERS, formatEuro } from "@/lib/site-content";
import PortalButton from "./PortalButton";

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: "Actif", tone: "bg-faraday-50 text-faraday-700" },
  PENDING: { label: "En attente de paiement", tone: "bg-amber-50 text-amber-700" },
  PAST_DUE: { label: "Paiement en retard", tone: "bg-red-50 text-red-700" },
  CANCELED: { label: "Résilié", tone: "bg-ardoise-100 text-ardoise-600" },
  EXPIRED: { label: "Expiré", tone: "bg-red-50 text-red-700" },
};

function fmtDate(d: Date | null): string {
  return d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

export default async function AbonnementPage() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { company: { include: { subscription: true } } },
  });
  const company = user?.company ?? null;

  if (!company) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold text-ardoise-900">Abonnement et facturation</h1>
        <div className="card">
          <p className="text-sm text-ardoise-600">
            Ce compte n&apos;est rattaché à aucun abonnement en ligne (compte historique). La facturation par
            abonnement concerne les entreprises inscrites depuis le site public.
          </p>
        </div>
      </div>
    );
  }

  const sub = company.subscription;
  const offer = OFFERS.find((o) => o.id === company.offerId) ?? OFFERS[0];
  const status = STATUS_LABELS[company.status] ?? { label: company.status, tone: "bg-ardoise-100 text-ardoise-600" };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-ardoise-900">Abonnement et facturation</h1>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ardoise-400">Entreprise</p>
            <p className="font-medium text-ardoise-900">{company.name}</p>
          </div>
          <span className={`badge ${status.tone}`}>{status.label}</span>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-ardoise-100 pt-4 text-sm">
          <Info label="Offre" value={offer.name} />
          <Info label="Prix" value={`${formatEuro(offer.priceCents)} / ${offer.period}`} />
          <Info label="Prochain renouvellement" value={fmtDate(sub?.currentPeriodEnd ?? null)} />
          <Info label="Renouvellement auto." value={sub?.cancelAtPeriodEnd ? "Résiliation à la fin de période" : "Oui"} />
        </dl>

        {company.status === "PAST_DUE" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Votre dernier paiement a échoué. Mettez à jour votre moyen de paiement pour conserver l&apos;accès.
          </p>
        )}

        <div className="border-t border-ardoise-100 pt-4">
          {company.stripeCustomerId ? (
            <>
              <PortalButton />
              <p className="mt-2 text-xs text-ardoise-400">
                Factures, moyen de paiement, changement de formule et résiliation se gèrent dans le portail sécurisé.
              </p>
            </>
          ) : (
            <Link href="/offres" className="btn-primary">Activer mon abonnement</Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ardoise-400">{label}</dt>
      <dd className="font-medium text-ardoise-800">{value}</dd>
    </div>
  );
}
