"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { assertOwner } from "@/lib/owner";
import { writeAuditLog } from "@/lib/audit";
import { validatePasswordStrength } from "@/lib/security";
import { stripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/email";

export type PlatformResult = { error?: string; success?: boolean; inviteLink?: string };

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Suspend l'accès d'une entreprise (les données sont conservées). */
export async function suspendCompanyAction(companyId: string, reason: string): Promise<PlatformResult> {
  const owner = await assertOwner();
  if (!owner.ok) return { error: owner.error };
  if (!reason.trim()) return { error: "Une justification est requise." };

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Entreprise introuvable." };

  await prisma.company.update({ where: { id: companyId }, data: { status: "SUSPENDED", suspendedAt: new Date() } });
  await writeAuditLog({ actorId: owner.id, action: "COMPANY_SUSPENDED", entityType: "Company", entityId: companyId, oldValue: { status: company.status }, newValue: { reason } });
  revalidatePath(`/platform-admin/entreprises/${companyId}`);
  revalidatePath("/platform-admin/entreprises");
  return { success: true };
}

/** Réactive une entreprise suspendue. */
export async function reactivateCompanyAction(companyId: string): Promise<PlatformResult> {
  const owner = await assertOwner();
  if (!owner.ok) return { error: owner.error };

  const company = await prisma.company.findUnique({ where: { id: companyId }, include: { subscription: true } });
  if (!company) return { error: "Entreprise introuvable." };

  // Retrouve un statut cohérent : FREE -> ACTIVE ; PAID -> selon l'abonnement.
  const restored = company.accessType === "FREE" ? "ACTIVE" : company.subscription?.status === "active" ? "ACTIVE" : "PENDING";
  await prisma.company.update({ where: { id: companyId }, data: { status: restored, suspendedAt: null } });
  await writeAuditLog({ actorId: owner.id, action: "COMPANY_REACTIVATED", entityType: "Company", entityId: companyId, newValue: { status: restored } });
  revalidatePath(`/platform-admin/entreprises/${companyId}`);
  return { success: true };
}

/** Résilie l'abonnement (à la fin de période ou immédiatement). */
export async function cancelSubscriptionOwnerAction(companyId: string, immediate: boolean, reason: string): Promise<PlatformResult> {
  const owner = await assertOwner();
  if (!owner.ok) return { error: owner.error };
  if (!reason.trim()) return { error: "Une justification est requise." };

  const company = await prisma.company.findUnique({ where: { id: companyId }, include: { subscription: true } });
  if (!company) return { error: "Entreprise introuvable." };

  const sub = company.subscription;
  if (sub && stripe) {
    try {
      if (immediate) {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
      }
    } catch {
      return { error: "Erreur lors de la résiliation côté Stripe." };
    }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { status: immediate ? "CANCELED" : company.status },
  });
  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: !immediate, canceledAt: immediate ? new Date() : sub.canceledAt, status: immediate ? "canceled" : sub.status },
    });
  }
  await writeAuditLog({ actorId: owner.id, action: immediate ? "SUB_CANCELED_NOW" : "SUB_CANCEL_PERIOD_END", entityType: "Company", entityId: companyId, newValue: { immediate, reason } });
  revalidatePath(`/platform-admin/entreprises/${companyId}`);
  return { success: true };
}

/** Enregistre une note administrative interne. */
export async function saveInternalNoteAction(companyId: string, note: string): Promise<PlatformResult> {
  const owner = await assertOwner();
  if (!owner.ok) return { error: owner.error };
  await prisma.company.update({ where: { id: companyId }, data: { internalNotes: note.trim() || null } });
  await writeAuditLog({ actorId: owner.id, action: "COMPANY_NOTE", entityType: "Company", entityId: companyId });
  revalidatePath(`/platform-admin/entreprises/${companyId}`);
  return { success: true };
}

/**
 * Crée manuellement une entreprise avec un PASSE GRATUIT (aucune carte, aucun
 * prélèvement). Le responsable reçoit un lien pour choisir son mot de passe.
 */
export async function createFreeCompanyAction(_prev: PlatformResult, formData: FormData): Promise<PlatformResult> {
  const owner = await assertOwner();
  if (!owner.ok) return { error: owner.error };

  const name = String(formData.get("name") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const freeUntilRaw = String(formData.get("freeUntil") ?? "").trim();
  const directPassword = String(formData.get("password") ?? "");

  if (!name || !firstName || !lastName || !email) return { error: "Nom d'entreprise, responsable et e-mail requis." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail invalide." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Un compte existe déjà avec cet e-mail." };

  const freeUntil = freeUntilRaw ? new Date(freeUntilRaw) : null; // null = gratuité permanente

  const company = await prisma.company.create({
    data: { name, status: "ACTIVE", accessType: "FREE", freeUntil, offerId: "essentiel" },
  });

  let inviteLink: string | undefined;
  if (directPassword.trim().length > 0) {
    const weak = validatePasswordStrength(directPassword);
    if (weak) return { error: weak };
    await prisma.user.create({
      data: { firstName, lastName, email, passwordHash: await hashPassword(directPassword), role: "ADMIN", active: true, companyId: company.id },
    });
  } else {
    const token = randomBytes(32).toString("hex");
    await prisma.user.create({
      data: {
        firstName, lastName, email,
        passwordHash: await hashPassword(randomBytes(8).toString("hex") + "Aa1!"),
        role: "ADMIN", active: true, mustChangePassword: true,
        inviteToken: token, inviteTokenExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
        companyId: company.id,
      },
    });
    inviteLink = `${getAppUrl()}/activer-compte?token=${token}`;
  }

  await writeAuditLog({ actorId: owner.id, action: "COMPANY_CREATED_FREE", entityType: "Company", entityId: company.id, newValue: { name, email, freeUntil } });
  revalidatePath("/platform-admin/entreprises");
  return { success: true, inviteLink };
}
