"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { isAdminOrRh } from "@/lib/permissions";
import { sendInviteEmail, sendPasswordResetEmail, getAppUrl } from "@/lib/email";
import { validatePasswordStrength } from "@/lib/security";
import type { ContractType, Role } from "@prisma/client";

export type UserFormResult = {
  error?: string;
  success?: boolean;
  inviteLink?: string;
  emailSent?: boolean;
};

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

function randomPassword() {
  return Math.random().toString(36).slice(-10) + "Aa1!";
}

/**
 * Vérifie qu'un code de pointage à 4 chiffres n'est pas déjà utilisé par
 * une autre personne (comparaison sur les hash). Deux assistantes ne
 * peuvent pas partager le même code, sinon l'identification serait ambiguë.
 */
async function pinAlreadyUsed(pin: string, excludeUserId?: string): Promise<boolean> {
  const withPin = await prisma.user.findMany({
    where: { clockPinHash: { not: null }, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
    select: { clockPinHash: true },
  });
  for (const u of withPin) {
    if (u.clockPinHash && (await verifyPassword(pin, u.clockPinHash))) return true;
  }
  return false;
}

function generateInviteToken() {
  return randomBytes(32).toString("hex");
}

/**
 * Seul l'administrateur peut créer ou inviter de nouveaux comptes
 * (assistantes, praticiens, RH, comptable). Le RH garde l'accès à la page
 * Équipe pour consulter/gérer les comptes existants, mais pas en créer.
 */
function isAdminOnly(role: Role) {
  return role === "ADMIN";
}

/** Crée un utilisateur — aucun rôle, horaire ou affectation n'est figé : tout vient du formulaire. */
export async function createUserAction(
  _prev: UserFormResult,
  formData: FormData
): Promise<UserFormResult> {
  const session = await getVerifiedSession();
  if (!session || !isAdminOnly(session.role)) {
    return { error: "Seul l'administrateur peut créer un compte." };
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "") as Role;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const color = String(formData.get("color") ?? "#3f7e75");
  const contractType = String(formData.get("contractType") ?? "TEMPS_PLEIN") as ContractType;
  const weeklyContractHours = Number(formData.get("weeklyContractHours") ?? 35);
  const specialty = String(formData.get("specialty") ?? "").trim() || null;
  const room = String(formData.get("room") ?? "").trim() || null;

  if (!firstName || !lastName || !email || !role) {
    return { error: "Merci de renseigner prénom, nom, email et rôle." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Un utilisateur avec cet email existe déjà." };

  // Code de pointage optionnel (assistantes) — 4 chiffres, unique.
  const clockPin = String(formData.get("clockPin") ?? "").trim();
  let clockPinHash: string | undefined;
  if (clockPin.length > 0) {
    if (!/^\d{4}$/.test(clockPin)) {
      return { error: "Le code de pointage doit contenir exactement 4 chiffres." };
    }
    if (await pinAlreadyUsed(clockPin)) {
      return { error: "Ce code de pointage est déjà utilisé par une autre personne." };
    }
    clockPinHash = await hashPassword(clockPin);
  }

  // Deux modes de création au choix de l'admin :
  //  1. Mot de passe défini directement (identifiant + mot de passe donnés
  //     de la main à la main à l'assistante) — pratique tant que le SMTP
  //     n'est pas configuré.
  //  2. Invitation : un lien permet à la personne de choisir son mot de passe.
  const password = String(formData.get("password") ?? "");
  const useDirectPassword = password.trim().length > 0;

  if (useDirectPassword) {
    const weak = validatePasswordStrength(password);
    if (weak) return { error: weak };
  }

  const profileData = {
    ...(role === "ASSISTANT" && {
      assistantProfile: { create: { contractType, weeklyContractHours } },
    }),
    ...(role === "PRATICIEN" && {
      practitionerProfile: { create: { specialty, room } },
    }),
  };

  if (useDirectPassword) {
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        color,
        role,
        passwordHash: await hashPassword(password),
        mustChangePassword: false,
        invitedById: session.id,
        ...(clockPinHash ? { clockPinHash } : {}),
        ...profileData,
      },
    });

    await writeAuditLog({ actorId: session.id, action: "CREATE_USER", entityType: "User", entityId: user.id, newValue: { firstName, lastName, email, role, credentials: "direct" } });

    revalidatePath("/equipe");
    return { success: true };
  }

  // Mot de passe temporaire inutilisable tant que l'invitation n'est pas
  // acceptée : la connexion ne sera possible qu'après activation du compte
  // via le lien envoyé par email (ou transmis manuellement par l'admin).
  const placeholderHash = await hashPassword(randomPassword());
  const inviteToken = generateInviteToken();
  const inviteTokenExpiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      color,
      role,
      passwordHash: placeholderHash,
      mustChangePassword: true,
      inviteToken,
      inviteTokenExpiresAt,
      invitedById: session.id,
      ...(clockPinHash ? { clockPinHash } : {}),
      ...profileData,
    },
  });

  const inviteLink = `${getAppUrl()}/activer-compte?token=${inviteToken}`;
  const { sent } = await sendInviteEmail(email, firstName, inviteLink);

  await writeAuditLog({ actorId: session.id, action: "CREATE_USER", entityType: "User", entityId: user.id, newValue: { firstName, lastName, email, role, credentials: "invite" } });

  revalidatePath("/equipe");
  return { success: true, inviteLink, emailSent: sent };
}

/**
 * Modifie un utilisateur existant (infos + profil assistante/praticien).
 * Un mot de passe peut être (re)défini directement de façon optionnelle.
 * Aucune donnée n'est figée : tout provient du formulaire.
 */
export async function updateUserAction(
  _prev: UserFormResult,
  formData: FormData
): Promise<UserFormResult> {
  const session = await getVerifiedSession();
  if (!session || !isAdminOnly(session.role)) {
    return { error: "Seul l'administrateur peut modifier un compte." };
  }

  const userId = String(formData.get("userId") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const color = String(formData.get("color") ?? "#3f7e75");
  const contractType = String(formData.get("contractType") ?? "TEMPS_PLEIN") as ContractType;
  const weeklyContractHours = Number(formData.get("weeklyContractHours") ?? 35);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const specialty = String(formData.get("specialty") ?? "").trim() || null;
  const room = String(formData.get("room") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");

  if (!userId || !firstName || !lastName || !email) {
    return { error: "Merci de renseigner prénom, nom et email." };
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) return { error: "Utilisateur introuvable." };

  // Email unique (hors utilisateur courant).
  const emailOwner = await prisma.user.findUnique({ where: { email } });
  if (emailOwner && emailOwner.id !== userId) {
    return { error: "Un autre utilisateur utilise déjà cet email." };
  }

  if (password.trim().length > 0) {
    const weak = validatePasswordStrength(password);
    if (weak) return { error: weak };
  }

  // Code de pointage (optionnel) — vide = inchangé.
  const clockPin = String(formData.get("clockPin") ?? "").trim();
  let clockPinHash: string | undefined;
  if (clockPin.length > 0) {
    if (!/^\d{4}$/.test(clockPin)) {
      return { error: "Le code de pointage doit contenir exactement 4 chiffres." };
    }
    if (await pinAlreadyUsed(clockPin, userId)) {
      return { error: "Ce code de pointage est déjà utilisé par une autre personne." };
    }
    clockPinHash = await hashPassword(clockPin);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      email,
      phone,
      color,
      ...(clockPinHash ? { clockPinHash } : {}),
      ...(password.trim().length > 0 && {
        passwordHash: await hashPassword(password),
        mustChangePassword: false,
        inviteToken: null,
        inviteTokenExpiresAt: null,
      }),
    },
  });

  if (existing.role === "ASSISTANT") {
    await prisma.assistantProfile.upsert({
      where: { userId },
      update: { contractType, weeklyContractHours, notes },
      create: { userId, contractType, weeklyContractHours, notes },
    });
  } else if (existing.role === "PRATICIEN") {
    await prisma.practitionerProfile.upsert({
      where: { userId },
      update: { specialty, room },
      create: { userId, specialty, room },
    });
  }

  await writeAuditLog({
    actorId: session.id,
    action: "UPDATE_USER",
    entityType: "User",
    entityId: userId,
    oldValue: { firstName: existing.firstName, lastName: existing.lastName, email: existing.email },
    newValue: { firstName, lastName, email, passwordReset: password.trim().length > 0 },
  });

  revalidatePath("/equipe");
  revalidatePath("/equipe/assistants");
  return { success: true };
}

/**
 * Supprime définitivement un utilisateur. Les données liées (pointages,
 * horaires, WorkEntry, etc.) sont supprimées en cascade (onDelete: Cascade
 * dans le schéma). Deux garde-fous : impossible de se supprimer soi-même ou
 * de supprimer le dernier administrateur (pour ne pas verrouiller l'accès).
 */
export async function deleteUserAction(userId: string): Promise<{ error?: string; success?: boolean }> {
  const session = await getVerifiedSession();
  if (!session || !isAdminOnly(session.role)) {
    return { error: "Seul l'administrateur peut supprimer un compte." };
  }
  if (userId === session.id) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Utilisateur introuvable." };

  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { error: "Impossible de supprimer le dernier administrateur." };
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  await writeAuditLog({
    actorId: session.id,
    action: "DELETE_USER",
    entityType: "User",
    entityId: userId,
    oldValue: { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
  });

  revalidatePath("/equipe");
  revalidatePath("/equipe/assistants");
  return { success: true };
}

export async function toggleActiveAction(userId: string) {
  const session = await getVerifiedSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } });
  await writeAuditLog({
    actorId: session.id,
    action: user.active ? "DEACTIVATE_USER" : "REACTIVATE_USER",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/equipe");
}

/**
 * Renvoie un nouveau lien d'activation/réinitialisation à l'utilisateur
 * (par email si SMTP est configuré, sinon le lien est retourné pour être
 * transmis manuellement). Remplace l'ancien système de mot de passe
 * temporaire généré en clair.
 */
export async function resetPasswordAction(userId: string): Promise<{ inviteLink: string; emailSent: boolean }> {
  const session = await getVerifiedSession();
  if (!session || !isAdminOnly(session.role)) throw new Error("Seul l'administrateur peut réinitialiser un mot de passe.");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  const placeholderHash = await hashPassword(randomPassword());
  const inviteToken = generateInviteToken();
  const inviteTokenExpiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: placeholderHash, mustChangePassword: true, inviteToken, inviteTokenExpiresAt },
  });

  const inviteLink = `${getAppUrl()}/activer-compte?token=${inviteToken}`;
  const { sent } = await sendPasswordResetEmail(user.email, user.firstName, inviteLink);

  await writeAuditLog({ actorId: session.id, action: "RESET_PASSWORD", entityType: "User", entityId: userId });
  revalidatePath("/equipe");
  return { inviteLink, emailSent: sent };
}

export async function assignAssistantAction(assistantId: string, practitionerId: string) {
  const session = await getVerifiedSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  const assignment = await prisma.assistantPractitionerAssignment.create({
    data: { assistantId, practitionerId },
  });

  await writeAuditLog({
    actorId: session.id,
    action: "ASSIGN_ASSISTANT",
    entityType: "AssistantPractitionerAssignment",
    entityId: assignment.id,
    newValue: { assistantId, practitionerId },
  });

  revalidatePath("/equipe");
  revalidatePath("/equipe/praticiens");
  revalidatePath("/equipe/assistants");
}

export async function unassignAssistantAction(assignmentId: string) {
  const session = await getVerifiedSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  const asg = await prisma.assistantPractitionerAssignment.findUnique({ where: { id: assignmentId }, select: { assistantId: true } });
  if (!asg) throw new Error("Introuvable");

  await prisma.assistantPractitionerAssignment.update({
    where: { id: assignmentId },
    data: { active: false, endDate: new Date() },
  });

  await writeAuditLog({ actorId: session.id, action: "UNASSIGN_ASSISTANT", entityType: "AssistantPractitionerAssignment", entityId: assignmentId });
  revalidatePath("/equipe");
}

export type ScheduleTemplateInput = {
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
};

export async function upsertScheduleTemplateAction(input: ScheduleTemplateInput) {
  const session = await getVerifiedSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  await prisma.scheduleTemplate.deleteMany({ where: { userId: input.userId, dayOfWeek: input.dayOfWeek } });
  await prisma.scheduleTemplate.create({
    data: {
      userId: input.userId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      breakStart: input.breakStart,
      breakEnd: input.breakEnd,
    },
  });

  await writeAuditLog({ actorId: session.id, action: "SET_SCHEDULE_TEMPLATE", entityType: "ScheduleTemplate", entityId: input.userId, newValue: input });
  revalidatePath("/equipe");
}
