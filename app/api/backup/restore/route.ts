import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { restoreBackupAction } from "@/lib/actions/backup";

/**
 * Restaure la base PostgreSQL à partir d'un fichier de sauvegarde JSON
 * (voir lib/actions/backup.ts pour la logique de restauration transactionnelle).
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

  const raw = await file.text();
  const result = await restoreBackupAction(raw);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
