import "server-only";
import Stripe from "stripe";

/**
 * Client Stripe côté serveur. Toutes les clés proviennent des variables
 * d'environnement — aucune clé n'est jamais écrite dans le code.
 * Si les clés ne sont pas configurées, `stripe` vaut null et l'application
 * continue de fonctionner (le paiement affiche simplement « non configuré »).
 */
const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey ? new Stripe(secretKey) : null;

export function isStripeConfigured(): boolean {
  return Boolean(secretKey);
}

export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

// Correspondance offre interne -> identifiant de prix Stripe (récurrent mensuel).
const PRICE_BY_OFFER: Record<string, string | undefined> = {
  essentiel: process.env.STRIPE_PRICE_ESSENTIEL,
};

export function priceIdForOffer(offerId: string): string | undefined {
  return PRICE_BY_OFFER[offerId];
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
