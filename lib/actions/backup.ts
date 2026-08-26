"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getVerifiedSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const BACKUP_VERSION = 1;

/**
 * Sérialise l'intégralité des données métier de la base PostgreSQL en un
 * objet JSON exportable. Les tables sont lues indépendamment (aucune
 * dépendance d'ordre en lecture).
 */
async function exportAllData() {
  const [
    cabinetSettings,
    users,
    practitionerProfiles,
    assistantProfiles,
    assignments,
    scheduleTemplates,
    workEntries,
    absences,
    adjustments,
    monthlyValidations,
    reports,
    notifications,
    auditLogs,
    clockEntries,
    messages,
    userPermissions,
  ] = await Promise.all([
    prisma.cabinetSettings.findMany(),
    prisma.user.findMany(),
    prisma.practitionerProfile.findMany(),
    prisma.assistantProfile.findMany(),
    prisma.assistantPractitionerAssignment.findMany(),
    prisma.scheduleTemplate.findMany(),
    prisma.workEntry.findMany(),
    prisma.absence.findMany(),
    prisma.adjustment.findMany(),
    prisma.monthlyValidation.findMany(),
    prisma.report.findMany(),
    prisma.notification.findMany(),
    prisma.auditLog.findMany(),
    prisma.clockEntry.findMany(),
    prisma.message.findMany(),
    prisma.userPermission.findMany(),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      cabinetSettings,
      users,
      practitionerProfiles,
      assistantProfiles,
      assignments,
      scheduleTemplates,
      workEntries,
      absences,
      adjustments,
      monthlyValidations,
      reports,
      notifications,
      auditLogs,
      clockEntries,
      messages,
      userPermissions,
    },
  };
}

type BackupPayload = Awaited<ReturnType<typeof exportAllData>>;

/**
 * Renvoie directement le contenu JSON au navigateur (aucune écriture disque) :
 * Vercel ne fournit pas de système de fichiers persistant pour les fonctions
 * serverless, la sauvegarde ne peut donc pas être stockée côté serveur. Le
 * fichier est téléchargé sur le poste de l'administrateur, comme pour la
 * restauration qui fonctionne déjà par upload de fichier.
 */
export async function createBackupAction() {
  const session = await getVerifiedSession();
  if (!session || session.role !== "ADMIN") throw new Error("Non autorisé");

  const payload = await exportAllData();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `faradayboard-backup-${stamp}.json`;
  const content = JSON.stringify(payload, null, 2);

  await writeAuditLog({
    actorId: session.id,
    action: "CREATE_BACKUP",
    entityType: "CabinetSettings",
    newValue: { fileName, users: payload.data.users.length },
  });

  return { fileName, content };
}

function isValidBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.version === "number" && typeof v.data === "object" && v.data !== null && Array.isArray((v.data as Record<string, unknown>).users);
}

/**
 * Remplace intégralement les données de la base par celles d'une sauvegarde.
 * Opération atomique (une seule transaction) : en cas d'erreur, PostgreSQL
 * annule tout et la base reste dans son état d'origine. Une sauvegarde de
 * sécurité de l'état actuel est créée juste avant, au cas où.
 */
export async function restoreBackupAction(
  raw: string
): Promise<{ error?: string; success?: boolean; safetyBackup?: { fileName: string; content: string } }> {
  const session = await getVerifiedSession();
  if (!session || session.role !== "ADMIN") return { error: "Non autorisé." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Le fichier n'est pas un JSON valide." };
  }
  if (!isValidBackupPayload(parsed)) {
    return { error: "Ce fichier ne correspond pas au format de sauvegarde attendu." };
  }
  const backup = parsed.data;

  // Filet de sécurité : on exporte l'état actuel avant de l'écraser et on le
  // renvoie au client (aucun système de fichiers persistant sur Vercel), qui
  // le télécharge automatiquement avant de confirmer la restauration.
  const safetyPayload = await exportAllData();
  const safetyFileName = `faradayboard-pre-restore-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const safetyContent = JSON.stringify(safetyPayload, null, 2);

  try {
    await prisma.$transaction(
      async (tx) => {
        // 1) On casse les références optionnelles vers User pour pouvoir le vider sans violer les contraintes.
        await tx.user.updateMany({ data: { invitedById: null } });
        await tx.workEntry.updateMany({ data: { createdById: null, validatedById: null } });
        await tx.absence.updateMany({ data: { reviewedById: null } });
        await tx.adjustment.updateMany({ data: { createdById: null } });
        await tx.report.updateMany({ data: { generatedById: null } });
        await tx.auditLog.updateMany({ data: { actorId: null } });
        await tx.clockEntry.updateMany({ data: { editedById: null } });

        // 2) Purge complète (Report/AuditLog n'ont pas de cascade depuis User ; le reste cascade depuis User).
        await tx.report.deleteMany({});
        await tx.auditLog.deleteMany({});
        await tx.user.deleteMany({});

        // 3) Recréation dans l'ordre des dépendances, en conservant les identifiants d'origine.
        if (backup.cabinetSettings?.[0]) {
          const cs = backup.cabinetSettings[0];
          await tx.cabinetSettings.upsert({ where: { id: cs.id }, create: cs, update: cs });
        }

        for (const u of backup.users) {
          const { invitedById: _invitedById, ...rest } = u;
          await tx.user.create({ data: rest });
        }
        for (const u of backup.users) {
          if (u.invitedById) {
            await tx.user.update({ where: { id: u.id }, data: { invitedById: u.invitedById } });
          }
        }

        for (const p of backup.practitionerProfiles) await tx.practitionerProfile.create({ data: p });
        for (const p of backup.assistantProfiles) await tx.assistantProfile.create({ data: p });
        for (const a of backup.scheduleTemplates) await tx.scheduleTemplate.create({ data: a });
        for (const a of backup.assignments) await tx.assistantPractitionerAssignment.create({ data: a });
        for (const w of backup.workEntries) await tx.workEntry.create({ data: w });
        for (const a of backup.absences) await tx.absence.create({ data: a });
        for (const a of backup.adjustments) await tx.adjustment.create({ data: a });
        for (const m of backup.monthlyValidations) await tx.monthlyValidation.create({ data: m });
        for (const r of backup.reports) await tx.report.create({ data: r });
        for (const n of backup.notifications) await tx.notification.create({ data: n });
        for (const a of backup.auditLogs) await tx.auditLog.create({ data: a });
        for (const c of backup.clockEntries) await tx.clockEntry.create({ data: c });
        for (const m of backup.messages) await tx.message.create({ data: m });
        for (const p of backup.userPermissions) await tx.userPermission.create({ data: p });
      },
      { timeout: 60_000 }
    );
  } catch (err) {
    return { error: `Échec de la restauration, aucune donnée n'a été modifiée (transaction annulée) : ${err instanceof Error ? err.message : "erreur inconnue"}` };
  }

  await writeAuditLog({
    actorId: session.id,
    action: "RESTORE_BACKUP",
    entityType: "CabinetSettings",
    newValue: { users: backup.users.length, safetyBackup: safetyFileName },
  });

  revalidatePath("/", "layout");
  return { success: true, safetyBackup: { fileName: safetyFileName, content: safetyContent } };
}
