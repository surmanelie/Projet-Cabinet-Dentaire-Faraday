import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getSession } from "./auth";

/**
 * Isolation multi-entreprise (multi-tenant).
 *
 * Chaque utilisateur appartient à une entreprise via `User.companyId`.
 * Les comptes historiques (cabinet d'origine) ont `companyId = null` : ils
 * forment leur propre « tenant » (null). Le super-administrateur plateforme a
 * aussi `companyId = null` MAIS le rôle SUPER_ADMIN — il est donc toujours
 * exclu des listes de membres d'entreprise.
 *
 * L'entreprise est TOUJOURS déterminée côté serveur à partir de la session,
 * jamais d'un identifiant transmis par le navigateur.
 */

/** companyId (tenant) de l'utilisateur connecté. `undefined` = non authentifié. */
export async function getSessionCompanyId(): Promise<string | null | undefined> {
  const session = await getSession();
  if (!session) return undefined;
  const u = await prisma.user.findUnique({ where: { id: session.id }, select: { companyId: true } });
  return u ? u.companyId : undefined;
}

/** Clause Prisma « membres de mon entreprise » (exclut le super-admin plateforme). */
export function companyMembersWhere(companyId: string | null): Prisma.UserWhereInput {
  return { companyId: companyId ?? null, role: { not: "SUPER_ADMIN" } };
}

/**
 * Vérifie qu'un utilisateur cible appartient bien à la même entreprise que
 * l'entreprise donnée (et n'est pas le super-admin). Utilisé avant toute
 * action (modifier / supprimer / désactiver) pour empêcher les accès
 * inter-entreprises via un identifiant manipulé.
 */
export async function isSameCompanyMember(targetUserId: string, companyId: string | null): Promise<boolean> {
  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { companyId: true, role: true } });
  if (!target) return false;
  if (target.role === "SUPER_ADMIN") return false;
  return (target.companyId ?? null) === (companyId ?? null);
}
