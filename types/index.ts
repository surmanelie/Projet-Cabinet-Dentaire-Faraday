import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  color: string;
};

// Clés de permissions fines, attribuables individuellement par utilisateur
// en plus des permissions par défaut de son rôle (UserPermission.permissionKey).
export const PERMISSION_KEYS = [
  "settings.manage_sensitive",
  "planning.edit_past",
  "planning.edit_future",
  "praticien.request_change",
  "praticien.signal_need",
  "praticien.add_note",
  "assistant.edit_future_days",
  "absences.self_request",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
