"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword, createSession, destroySession, getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { defaultRouteForRole } from "@/lib/permissions";
import { validatePasswordStrength, getClientIp, isLoginBlocked, RATE_LIMITS } from "@/lib/security";

export type LoginResult = { error?: string };

export type ActivateAccountResult = { error?: string; success?: boolean };

/**
 * Valide le lien d'invitation (token + expiration), définit le mot de passe
 * choisi par l'utilisateur, et termine l'activation du compte. Le token est
 * ensuite invalidé pour qu'il ne puisse pas être réutilisé.
 */
export async function activateAccountAction(
  _prev: ActivateAccountResult,
  formData: FormData
): Promise<ActivateAccountResult> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "Lien d'invitation invalide." };
  }
  const weak = validatePasswordStrength(password);
  if (weak) return { error: weak };
  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const user = await prisma.user.findUnique({ where: { inviteToken: token } });
  if (!user || !user.inviteTokenExpiresAt || user.inviteTokenExpiresAt < new Date()) {
    return { error: "Ce lien d'invitation est invalide ou a expiré. Demande à l'administrateur de t'en renvoyer un." };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      inviteToken: null,
      inviteTokenExpiresAt: null,
    },
  });

  await writeAuditLog({ actorId: user.id, action: "ACTIVATE_ACCOUNT", entityType: "User", entityId: user.id });

  return { success: true };
}

export async function loginAction(
  _prev: LoginResult,
  formData: FormData
): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  const redirectTo = String(formData.get("redirectTo") ?? "").trim() || null;

  if (!email || !password) {
    return { error: "Merci de renseigner votre email et votre mot de passe." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active) {
    return { error: "Identifiants invalides ou compte désactivé." };
  }

  // Protection anti-force-brute : blocage temporaire après trop d'échecs.
  if (await isLoginBlocked(user.id)) {
    return {
      error: `Trop de tentatives. Réessayez dans ${RATE_LIMITS.LOGIN_WINDOW_MIN} minutes.`,
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await writeAuditLog({
      actorId: user.id,
      action: "LOGIN_FAILED",
      entityType: "User",
      entityId: user.id,
      ipAddress: await getClientIp(),
    });
    return { error: "Identifiants invalides ou compte désactivé." };
  }

  await createSession(
    {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      color: user.color,
    },
    remember
  );

  await writeAuditLog({
    actorId: user.id,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
  });

  // Si l'utilisateur venait d'une page protégée (ex: scan QR), on l'y renvoie.
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : defaultRouteForRole(user.role);

  redirect(safeRedirect);
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await writeAuditLog({ actorId: session.id, action: "LOGOUT", entityType: "User", entityId: session.id });
  }
  await destroySession();
  redirect("/login");
}
