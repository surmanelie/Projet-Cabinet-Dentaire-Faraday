import "server-only";
import { headers } from "next/headers";
import { prisma } from "./prisma";

/**
 * Valide la robustesse d'un mot de passe. Renvoie un message d'erreur si le
 * mot de passe est trop faible, ou null s'il est acceptable.
 * Règle : au moins 8 caractères, avec au moins une lettre et un chiffre.
 */
export function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  }
  return null;
}

/** Adresse IP du client (derrière le proxy Vercel). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

const LOGIN_MAX_FAILURES = 5;
const LOGIN_WINDOW_MIN = 15;
const PIN_MAX_FAILURES = 10;
const PIN_WINDOW_MIN = 10;

/** true si le compte a trop de connexions échouées récentes (anti-force-brute). */
export async function isLoginBlocked(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - LOGIN_WINDOW_MIN * 60_000);
  const count = await prisma.auditLog.count({
    where: { actorId: userId, action: "LOGIN_FAILED", createdAt: { gte: since } },
  });
  return count >= LOGIN_MAX_FAILURES;
}

/** true si cette IP a trop de codes de pointage erronés récents. */
export async function isPinBlocked(ip: string): Promise<boolean> {
  if (ip === "unknown") return false;
  const since = new Date(Date.now() - PIN_WINDOW_MIN * 60_000);
  const count = await prisma.auditLog.count({
    where: { action: "CLOCK_PIN_FAILED", ipAddress: ip, createdAt: { gte: since } },
  });
  return count >= PIN_MAX_FAILURES;
}

export const RATE_LIMITS = {
  LOGIN_WINDOW_MIN,
  PIN_WINDOW_MIN,
};
