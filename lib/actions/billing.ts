"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, getSession } from "@/lib/auth";
import { validatePasswordStrength } from "@/lib/security";
import { writeAuditLog } from "@/lib/audit";
import { stripe, isStripeConfigured, priceIdForOffer, appUrl } from "@/lib/stripe";
import { getOffer } from "@/lib/site-content";

export type CheckoutResult = { error?: string; url?: string };

/**
 * Démarre l'abonnement : enregistre l'entreprise en attente puis crée une
 * session de paiement Stripe (mode abonnement). L'entreprise et le compte
 * administrateur ne seront réellement activés qu'à la confirmation du
 * paiement, via le webhook — jamais sur simple redirection.
 */
export async function startCheckoutAction(_prev: CheckoutResult, formData: FormData): Promise<CheckoutResult> {
  const offerId = String(formData.get("offerId") ?? "essentiel");
  const offer = getOffer(offerId);
  if (!offer) return { error: "Offre inconnue." };

  const company = String(formData.get("company") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const cgu = formData.get("cgu") === "on";
  const rgpd = formData.get("rgpd") === "on";

  if (!company || !firstName || !lastName || !email) return { error: "Merci de remplir les champs obligatoires." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Adresse e-mail invalide." };
  const weak = validatePasswordStrength(password);
  if (weak) return { error: weak };
  if (!cgu || !rgpd) return { error: "Vous devez accepter les conditions générales et la politique de confidentialité." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Un compte existe déjà avec cet e-mail. Connectez-vous." };

  if (!isStripeConfigured() || !stripe) {
    return { error: "Le paiement n'est pas encore configuré. Réessayez plus tard." };
  }
  const priceId = priceIdForOffer(offerId);
  if (!priceId) return { error: "Cette offre n'est pas encore disponible à la vente." };

  const passwordHash = await hashPassword(password);

  const newCompany = await prisma.company.create({
    data: {
      name: company,
      legalName: String(formData.get("legal") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      zip: String(formData.get("zip") ?? "").trim() || null,
      country: String(formData.get("country") ?? "").trim() || null,
      vat: String(formData.get("vat") ?? "").trim() || null,
      employeesCount: Number(formData.get("employees")) || null,
      status: "PENDING",
      offerId,
      pendingAdminEmail: email,
      pendingAdminFirstName: firstName,
      pendingAdminLastName: lastName,
      pendingAdminPasswordHash: passwordHash,
    },
  });

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      metadata: { companyId: newCompany.id },
      subscription_data: { metadata: { companyId: newCompany.id } },
      success_url: `${appUrl()}/paiement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/paiement/annule`,
    });

    await writeAuditLog({ actorId: null, action: "CHECKOUT_STARTED", entityType: "Company", entityId: newCompany.id, newValue: { offerId } });

    if (!checkout.url) return { error: "Impossible de démarrer le paiement." };
    return { url: checkout.url };
  } catch {
    return { error: "Erreur lors de la création du paiement. Réessayez." };
  }
}

/** Ouvre le portail client Stripe (facturation, moyen de paiement, résiliation). */
export async function openBillingPortalAction(): Promise<{ error?: string; url?: string }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };
  if (!isStripeConfigured() || !stripe) return { error: "Facturation non configurée." };

  const user = await prisma.user.findUnique({ where: { id: session.id }, include: { company: true } });
  if (!user?.company?.stripeCustomerId) return { error: "Aucun abonnement associé à ce compte." };
  if (session.role !== "ADMIN") return { error: "Réservé à l'administrateur de l'entreprise." };

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.company.stripeCustomerId,
    return_url: `${appUrl()}/abonnement`,
  });
  return { url: portal.url };
}
