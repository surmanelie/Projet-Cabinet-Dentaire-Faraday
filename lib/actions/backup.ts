"use server";

import fs from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
const BACKUP_DIR = path.join(process.cwd(), "backups");

async function ensureBackupDir() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

export async function createBackupAction() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Non autorisé");

  await ensureBackupDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `faradayboard-backup-${stamp}.db`;
  await fs.copyFile(DB_PATH, path.join(BACKUP_DIR, fileName));

  await writeAuditLog({
    actorId: session.id,
    action: "CREATE_BACKUP",
    entityType: "CabinetSettings",
    newValue: { fileName },
  });

  revalidatePath("/parametres/sauvegarde");
  return { fileName };
}

export async function listBackupsAction() {
  await ensureBackupDir();
  const files = await fs.readdir(BACKUP_DIR);
  const stats = await Promise.all(
    files
      .filter((f) => f.endsWith(".db"))
      .map(async (f) => {
        const stat = await fs.stat(path.join(BACKUP_DIR, f));
        return { name: f, size: stat.size, mtime: stat.mtime };
      })
  );
  return stats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

export async function deleteBackupAction(fileName: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Non autorisé");
  if (fileName.includes("..") || fileName.includes("/")) throw new Error("Nom de fichier invalide");

  await fs.unlink(path.join(BACKUP_DIR, fileName));
  await writeAuditLog({ actorId: session.id, action: "DELETE_BACKUP", entityType: "CabinetSettings", newValue: { fileName } });
  revalidatePath("/parametres/sauvegarde");
}
