import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Garde d'accès au back-office propriétaire. Vérifie EN BASE que l'utilisateur
 * est bien SUPER_ADMIN (pas seulement d'après le cookie). À appeler dans le
 * layout et dans chaque action sensible du back-office.
 */
export async function requireOwner() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.active || user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }
  return session;
}

/** Variante pour les Server Actions : renvoie l'erreur au lieu de rediriger. */
export async function assertOwner(): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Non authentifié." };
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.active || user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Accès réservé au propriétaire de la plateforme." };
  }
  return { ok: true, id: session.id };
}
