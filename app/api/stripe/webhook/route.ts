import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, WEBHOOK_SECRET } from "@/lib/stripe";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Statut d'entreprise déduit du statut d'abonnement Stripe.
function companyStatus(subStatus: string): string {
  switch (subStatus) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    default:
      return "PENDING";
  }
}

/** Enregistre/actualise l'abonnement et le statut de l'entreprise (idempotent). */
type Periods = { current_period_start?: number | null; current_period_end?: number | null };

async function syncSubscription(sub: Stripe.Subscription, companyId: string) {
  const item = sub.items.data[0];
  const priceId = item?.price.id ?? "";
  // Les périodes sont au niveau abonnement (anciennes versions) ou au niveau
  // de l'item (versions récentes) : on lit les deux.
  const p = (sub as unknown as Periods);
  const pItem = (item as unknown as Periods) ?? {};
  const startUnix = p.current_period_start ?? pItem.current_period_start ?? null;
  const endUnix = p.current_period_end ?? pItem.current_period_end ?? null;
  const periodStart = startUnix ? new Date(startUnix * 1000) : null;
  const periodEnd = endUnix ? new Date(endUnix * 1000) : null;

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    update: {
      status: sub.status,
      stripePriceId: priceId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
    create: {
      companyId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });

  await prisma.company.update({
    where: { id: companyId },
    data: { status: companyStatus(sub.status) },
  });
}

/**
 * Active l'entreprise après paiement confirmé : crée le compte administrateur
 * (à partir des données d'inscription conservées) et l'abonnement. Entièrement
 * idempotent — un même événement reçu plusieurs fois ne crée pas de doublon.
 */
async function activateCompany(companyId: string, customerId: string, sub: Stripe.Subscription) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return;

  // Crée l'administrateur s'il n'existe pas déjà (idempotence par e-mail).
  if (company.pendingAdminEmail) {
    const already = await prisma.user.findUnique({ where: { email: company.pendingAdminEmail } });
    if (!already && company.pendingAdminPasswordHash) {
      await prisma.user.create({
        data: {
          firstName: company.pendingAdminFirstName ?? "Admin",
          lastName: company.pendingAdminLastName ?? company.name,
          email: company.pendingAdminEmail,
          passwordHash: company.pendingAdminPasswordHash,
          role: "ADMIN",
          active: true,
          companyId: company.id,
        },
      });
    }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { stripeCustomerId: customerId, status: "ACTIVE" },
  });

  await syncSubscription(sub, companyId);
  await writeAuditLog({ actorId: null, action: "COMPANY_ACTIVATED", entityType: "Company", entityId: companyId });
}

export async function POST(req: NextRequest) {
  if (!stripe || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const companyId = s.metadata?.companyId;
        const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        const subscriptionId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        if (companyId && customerId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await activateCompany(companyId, customerId, sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const companyId = sub.metadata?.companyId;
        if (companyId) await syncSubscription(sub, companyId);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const subRef = (inv as unknown as { subscription?: string | { id: string } | null }).subscription;
        const subId = typeof subRef === "string" ? subRef : subRef?.id;
        if (subId) {
          await prisma.subscription.updateMany({ where: { stripeSubscriptionId: subId }, data: { status: "past_due" } });
          const s = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subId } });
          if (s) await prisma.company.update({ where: { id: s.companyId }, data: { status: "PAST_DUE" } });
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: "Erreur de traitement" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
