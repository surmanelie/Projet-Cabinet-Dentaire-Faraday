import "server-only";
import { prisma } from "./prisma";

type AuditParams = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
};

/**
 * Enregistre une entrée dans le journal d'audit. Appelé depuis toutes les
 * actions sensibles (connexion, création/modif utilisateur, horaires,
 * validations, exports, restauration...).
 */
export async function writeAuditLog(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue !== undefined ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue !== undefined ? JSON.stringify(params.newValue) : null,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (err) {
    // Ne jamais faire crasher une action métier à cause du journal d'audit.
    // Arrive p. ex. quand actorId pointe vers un utilisateur supprimé/resetté.
    console.error("[AuditLog] Échec écriture audit log:", err);
  }
}

export async function notifyUser(userId: string, title: string, message: string, link?: string) {
  await prisma.notification.create({
    data: { userId, title, message, link },
  });
}
