"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAuditLog, notifyUser } from "@/lib/audit";
import { isAdminOrRh } from "@/lib/permissions";
import { startOfParisDay, getParisDayOfWeek } from "@/lib/timezone";
import { dateKey } from "@/lib/agenda";

/** Récupère (ou crée à partir de l'horaire type) l'entrée du jour pour un utilisateur. */
export async function getOrCreateTodayEntry(userId: string) {
  const today = startOfParisDay(new Date());

  const existing = await prisma.workEntry.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (existing) return existing;

  const dayOfWeek = getParisDayOfWeek(today);
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

/**
 * "YYYY-MM-DD" → minuit Paris de ce jour, comme `WorkEntry.date` partout
 * ailleurs (syncWorkEntryFromClock, getOrCreateTodayEntry) — sinon la même
 * journée calendaire produirait deux valeurs de `date` différentes (une
 * UTC-minuit ici, une Paris-minuit côté pointage), dupliquant la ligne au
 * lieu de la mettre à jour (violation silencieuse de l'intention de la
 * contrainte unique `userId_date`).
 */
function parseDateKey(key: string): Date {
  return startOfParisDay(new Date(`${key}T00:00:00`));
}

const toDateKey = dateKey;

export type BulkEditResult = { error?: string; success?: boolean; skippedLocked?: string[] };

/**
 * Programme (planifie) l'horaire d'un ou plusieurs jours pour une
 * assistante, en une seule opération — admin/RH uniquement. N'écrit QUE
 * `plannedStart`/`plannedEnd`/`comment` : ne touche jamais `actualStart`/
 * `actualEnd`/`breakMinutes`/`status`, qui restent la source de vérité du
 * temps RÉELLEMENT pointé (alimentée uniquement par le pointage QR/PIN ou
 * une correction explicite). Les jours verrouillés (mois validé) sont
 * ignorés et remontés dans `skippedLocked`.
 */
export async function bulkUpdateWorkEntriesAction(
  userId: string,
  dateKeys: string[],
  data: { plannedStart: string; plannedEnd: string; comment?: string }
): Promise<BulkEditResult> {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) return { error: "Non autorisé." };
  if (!data.plannedStart || !data.plannedEnd) {
    return { error: "Merci de renseigner une heure de début et de fin." };
  }
  if (dateKeys.length === 0) return { error: "Aucun jour sélectionné." };

  const dates = dateKeys.map(parseDateKey);

  const existing = await prisma.workEntry.findMany({
    where: { userId, date: { in: dates } },
  });
  const lockedByTime = new Set(existing.filter((e) => e.locked).map((e) => e.date.getTime()));

  const skippedLocked: string[] = [];
  const toApply: Date[] = [];
  for (const d of dates) {
    if (lockedByTime.has(d.getTime())) {
      skippedLocked.push(toDateKey(d));
    } else {
      toApply.push(d);
    }
  }

  if (toApply.length > 0) {
    await prisma.$transaction(
      toApply.map((date) =>
        prisma.workEntry.upsert({
          where: { userId_date: { userId, date } },
          update: {
            plannedStart: data.plannedStart,
            plannedEnd: data.plannedEnd,
            ...(data.comment ? { comment: data.comment } : {}),
          },
          create: {
            userId,
            date,
            plannedStart: data.plannedStart,
            plannedEnd: data.plannedEnd,
            comment: data.comment ?? null,
            source: "planning_admin",
            status: "PRE_REMPLI",
          },
        })
      )
    );

    await writeAuditLog({
      actorId: session.id,
      action: "BULK_UPDATE_PLANNING",
      entityType: "WorkEntry",
      entityId: userId,
      newValue: {
        dates: toApply.map(toDateKey),
        plannedStart: data.plannedStart,
        plannedEnd: data.plannedEnd,
      },
    });
  }

  revalidatePath("/planning");
  revalidatePath("/equipe/heures");
  revalidatePath("/mes-horaires");
  revalidatePath("/dashboard");

  return { success: true, skippedLocked: skippedLocked.length ? skippedLocked : undefined };
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
