import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import type { PermissionKey } from "@/types";

// Permissions par défaut accordées à chaque rôle. L'admin peut ensuite
// affiner pour un utilisateur précis via UserPermission (table dynamique).
const ROLE_DEFAULTS: Record<Role, Set<string>> = {
  ADMIN: new Set([
    "users.manage",
    "roles.manage",
    "planning.manage",
    "schedules.manage",
    "absences.manage",
    "validations.manage",
    "reports.manage",
    "settings.manage",
    "settings.manage_sensitive",
    "backups.manage",
    "audit.view",
    "planning.edit_past",
    "planning.edit_future",
  ]),
  RH: new Set([
    "planning.manage",
    "schedules.manage",
    "absences.manage",
    "validations.manage",
    "reports.manage",
    "planning.edit_past",
    "planning.edit_future",
  ]),
  PRATICIEN: new Set([
    "praticien.view_team",
    "praticien.request_change",
    "praticien.signal_need",
    "praticien.add_note",
  ]),
  ASSISTANT: new Set([
    "assistant.view_self",
    "assistant.confirm_day",
    "absences.self_request",
  ]),
  COMPTABLE: new Set(["reports.view", "validations.view"]),
};

export function roleHasDefaultPermission(role: Role, key: string): boolean {
  return ROLE_DEFAULTS[role]?.has(key) ?? false;
}

/**
 * Vérifie si un utilisateur a une permission donnée : permission spécifique
 * (UserPermission) en priorité, sinon retombe sur les permissions par défaut
 * de son rôle. Rien n'est codé en dur par utilisateur.
 */
export async function userHasPermission(
  userId: string,
  role: Role,
  key: PermissionKey | string
): Promise<boolean> {
  const override = await prisma.userPermission.findUnique({
    where: { userId_permissionKey: { userId, permissionKey: key } },
  });
  if (override) return override.enabled;
  return roleHasDefaultPermission(role, key);
}

export function isAdminOrRh(role: Role) {
  return role === "ADMIN" || role === "RH";
}

// Pages et préfixes accessibles par rôle — utilisé par le middleware pour
// bloquer tout accès non autorisé côté serveur (pas seulement côté UI).
export const ROUTE_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard", roles: ["ADMIN", "RH"] },
  { prefix: "/mon-espace", roles: ["ASSISTANT"] },
  { prefix: "/mes-horaires", roles: ["ASSISTANT"] },
  { prefix: "/espace-praticien", roles: ["PRATICIEN"] },
  { prefix: "/planning", roles: ["ADMIN", "RH", "PRATICIEN"] },
  { prefix: "/equipe", roles: ["ADMIN", "RH"] },
  { prefix: "/absences", roles: ["ADMIN", "RH", "ASSISTANT", "PRATICIEN"] },
  { prefix: "/pointage", roles: ["ADMIN", "RH", "ASSISTANT"] },
  { prefix: "/validations", roles: ["ADMIN", "RH", "ASSISTANT", "COMPTABLE"] },
  { prefix: "/rapports", roles: ["ADMIN", "RH", "COMPTABLE"] },
  { prefix: "/parametres", roles: ["ADMIN", "RH"] },
  { prefix: "/audit", roles: ["ADMIN"] },
];

export function canAccessRoute(pathname: string, role: Role): boolean {
  const rule = ROUTE_ACCESS.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return true; // routes publiques (login, etc.)
  return rule.roles.includes(role);
}

export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
    case "RH":
      return "/dashboard";
    case "PRATICIEN":
      return "/espace-praticien";
    case "ASSISTANT":
      return "/mon-espace";
    case "COMPTABLE":
      return "/rapports";
    default:
      return "/login";
  }
}
