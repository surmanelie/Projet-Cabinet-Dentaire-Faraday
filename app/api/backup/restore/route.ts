import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
const BACKUP_DIR = path.join(process.cwd(), "backups");

/**
 * Restaure la base SQLite à partir d'un fichier de sauvegarde envoyé par l'admin.
 * Une copie de sécurité de la base actuelle est créée avant tout remplacement.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const safetyCopy = path.join(BACKUP_DIR, `pre-restore-${Date.now()}.db`);
  await fs.copyFile(DB_PATH, safetyCopy).catch(() => null);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(DB_PATH, buffer);

  await writeAuditLog({
    actorId: session.id,
    action: "RESTORE_BACKUP",
    entityType: "CabinetSettings",
    newValue: { restoredFrom: file.name },
  });

  return NextResponse.json({ success: true });
}
