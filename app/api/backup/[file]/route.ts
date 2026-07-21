import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKUP_DIR = path.join(process.cwd(), "backups");

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { file } = await params;
  if (file.includes("..") || file.includes("/")) {
    return NextResponse.json({ error: "Nom de fichier invalide" }, { status: 400 });
  }

  try {
    const buffer = await fs.readFile(path.join(BACKUP_DIR, file));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
