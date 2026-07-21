"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAuditLog, notifyUser } from "@/lib/audit";
import { isAdminOrRh } from "@/lib/permissions";

/** Récupère (ou crée à partir de l'horaire type) l'entrée du jour pour un utilisateur. */
export async function getOrCreateTodayEntry(userId: string) {
  const today = startOfDay(new Date());

  const existing = await prisma.workEntry.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (existing) return existing;

  const dayOfWeek = today.getDay();
  const template = await prisma.scheduleTemplate.findFirst({
    where: { userId, dayOfWeek, active: true },
  });

  return prisma.workEntry.create({
    data: {
      userId,
      date: today,
      plannedStart: template?.startTime ?? null,
      plannedEnd: template?.endTime ?? null,
      status: "PRE_REMPLI",
      source: template ? "template" : "manuel",
    },
  });
}

/** L'assistant(e) confirme ses horaires du jour tels que pré-remplis. */
export async function confirmTodayAction() {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const entry = await getOrCreateTodayEntry(session.id);
  await prisma.workEntry.update({
    where: { id: entry.id },
    data: {
      status: "CONFIRME",
      actualStart: entry.plannedStart,
      actualEnd: entry.plannedEnd,
    },
  });

  await writeAuditLog({ actorId: session.id, action: "CONFIRM_DAY", entityType: "WorkEntry", entityId: entry.id });
  revalidatePath("/mon-espace");
}

export type EditDayResult = { error?: string; success?: boolean };

/**
 * Modification des horaires du jour par l'assistant(e). Règle : seule la
 * date du jour est modifiable (les jours passés sont verrouillés, gérés
 * uniquement par ADMIN/RH). Toute modification passe au statut "à valider".
 */
export async function editTodayAction(
  _prev: EditDayResult,
  formData: FormData
): Promise<EditDayResult> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  const breakMinutes = Number(formData.get("breakMinutes") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!start || !end) {
    return { error: "Merci de renseigner une heure d'arrivée et de départ." };
  }
  if (!comment) {
    return { error: "Un commentaire est requis pour justifier la modification." };
  }

  const entry = await getOrCreateTodayEntry(session.id);
  if (entry.locked) {
    return { error: "Cette journée est verrouillée et ne peut plus être modifiée." };
  }

  const before = { actualStart: entry.actualStart, actualEnd: entry.actualEnd };

  await prisma.workEntry.update({
    where: { id: entry.id },
    data: {
      actualStart: start,
      actualEnd: end,
      breakMinutes,
      comment,
      status: "A_VALIDER",
      source: "manuel",
    },
  });

  await writeAuditLog({
    actorId: session.id,
    action: "EDIT_TODAY",
    entityType: "WorkEntry",
    entityId: entry.id,
    oldValue: before,
    newValue: { actualStart: start, actualEnd: end, breakMinutes, comment },
  });

  revalidatePath("/mon-espace");
  return { success: true };
}

/**
 * Correction par ADMIN/RH d'une journée — passée ou future, sans
 * restriction. Toute correction doit être justifiée par un commentaire.
 */
export async function correctEntryAction(
  entryId: string,
  data: { actualStart: string; actualEnd: string; breakMinutes: number; comment: string }
) {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");
  if (!data.comment.trim()) throw new Error("Un commentaire de justification est requis.");

  const entry = await prisma.workEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error("Entrée introuvable");

  await prisma.workEntry.update({
    where: { id: entryId },
    data: {
      actualStart: data.actualStart,
      actualEnd: data.actualEnd,
      breakMinutes: data.breakMinutes,
      comment: data.comment,
      status: "CORRIGE",
      validatedById: session.id,
      validatedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: session.id,
    action: "CORRECT_ENTRY",
    entityType: "WorkEntry",
    entityId: entryId,
    oldValue: entry,
    newValue: data,
  });

  await notifyUser(entry.userId, "Horaire corrigé", "Une de vos journées a été corrigée par le RH.", "/mes-horaires");
  revalidatePath("/planning");
}

export async function validateEntryAction(entryId: string) {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  await prisma.workEntry.update({
    where: { id: entryId },
    data: { status: "VALIDE", validatedById: session.id, validatedAt: new Date() },
  });

  await writeAuditLog({ actorId: session.id, action: "VALIDATE_ENTRY", entityType: "WorkEntry", entityId: entryId });
  revalidatePath("/planning");
}
