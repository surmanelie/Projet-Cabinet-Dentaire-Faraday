"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, verifyPassword } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { deriveDayFromClock } from "@/lib/clock-hours";
import type { ClockAction } from "@prisma/client";

// Statuts de WorkEntry issus du workflow de validation : on ne les écrase
// jamais automatiquement depuis un pointage (une journée déjà validée ou
// verrouillée reste figée).
const VALIDATED_STATUSES = ["A_VALIDER", "VALIDE", "REFUSE", "CORRIGE", "VERROUILLE"];

/**
 * Recalcule le WorkEntry d'une journée à partir des pointages QR de cette
 * journée. C'est le pont entre le pointage (ClockEntry) et le calcul des
 * heures (hours-engine, qui lit WorkEntry). Appelé après chaque pointage,
 * correction ou ajout manuel.
 *
 * - N'écrase jamais une journée verrouillée ou déjà validée (statut préservé).
 * - Si plus aucun pointage exploitable ne subsiste et que la journée venait
 *   du pointage, l'entrée est supprimée pour ne pas laisser de donnée morte.
 */
async function syncWorkEntryFromClock(userId: string, day: Date): Promise<void> {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const entries = await prisma.clockEntry.findMany({
    where: { userId, timestamp: { gte: dayStart, lt: dayEnd } },
    orderBy: { timestamp: "asc" },
  });

  const derived = deriveDayFromClock(
    entries.map((e) => ({ action: e.action, timestamp: e.timestamp }))
  );

  const existing = await prisma.workEntry.findUnique({
    where: { userId_date: { userId, date: dayStart } },
  });

  if (existing?.locked) return; // journée verrouillée : intouchable

  if (!derived.actualStart) {
    if (existing && existing.source === "pointage") {
      await prisma.workEntry.delete({ where: { id: existing.id } });
    }
    return;
  }

  const keepStatus = existing ? VALIDATED_STATUSES.includes(existing.status) : false;
  const nextStatus = derived.complete ? "CONFIRME" : "PRE_REMPLI";

  await prisma.workEntry.upsert({
    where: { userId_date: { userId, date: dayStart } },
    update: {
      actualStart: derived.actualStart,
      actualEnd: derived.actualEnd,
      breakMinutes: derived.breakMinutes,
      source: "pointage",
      ...(keepStatus ? {} : { status: nextStatus }),
    },
    create: {
      userId,
      date: dayStart,
      actualStart: derived.actualStart,
      actualEnd: derived.actualEnd,
      breakMinutes: derived.breakMinutes,
      source: "pointage",
      status: nextStatus,
    },
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClockResult = {
  success?: boolean;
  error?: string;
  action?: ClockAction;
  timestamp?: Date;
  userName?: string;
};

export type ClockStatus =
  | "ABSENT"         // pas encore pointé aujourd'hui
  | "PRESENT"        // début journée enregistré, pas en pause
  | "EN_PAUSE"       // pause en cours
  | "JOURNEE_TERMINEE"; // fin journée enregistrée

// ─── Règles de succession des actions ─────────────────────────────────────────

/**
 * Renvoie l'erreur si l'action demandée est incohérente avec l'état actuel,
 * ou null si tout est OK.
 */
function validateTransition(
  lastAction: ClockAction | null,
  next: ClockAction
): string | null {
  switch (next) {
    case "DEBUT_JOURNEE":
      if (lastAction === "DEBUT_JOURNEE" || lastAction === "DEBUT_PAUSE" || lastAction === "FIN_PAUSE") {
        return "Vous avez déjà commencé votre journée.";
      }
      if (lastAction === "FIN_JOURNEE") {
        return "Votre journée est déjà terminée.";
      }
      return null;

    case "DEBUT_PAUSE":
      if (lastAction === null || lastAction === "FIN_JOURNEE") {
        return "Vous devez d'abord pointer un début de journée.";
      }
      if (lastAction === "DEBUT_PAUSE") {
        return "Une pause est déjà en cours.";
      }
      return null;

    case "FIN_PAUSE":
      if (lastAction !== "DEBUT_PAUSE") {
        return "Aucune pause en cours à terminer.";
      }
      return null;

    case "FIN_JOURNEE":
      if (lastAction === null) {
        return "Vous devez d'abord pointer un début de journée.";
      }
      if (lastAction === "DEBUT_PAUSE") {
        return "Vous êtes en pause — terminez d'abord la pause.";
      }
      if (lastAction === "FIN_JOURNEE") {
        return "Votre journée est déjà terminée.";
      }
      return null;
  }
}

// ─── Actions publiques ────────────────────────────────────────────────────────

/**
 * Enregistre un pointage pour l'assistante connectée.
 * Vérifie les transitions d'état avant d'écrire.
 */
export async function recordClockAction(action: ClockAction): Promise<ClockResult> {
  const session = await getSession();
  if (!session) {
    return { error: "Vous devez être connecté pour pointer." };
  }

  // Récupère le dernier pointage du jour de cette assistante
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const lastEntry = await prisma.clockEntry.findFirst({
    where: { userId: session.id, timestamp: { gte: todayStart } },
    orderBy: { timestamp: "desc" },
  });

  const error = validateTransition(lastEntry?.action ?? null, action);
  if (error) return { error };

  const entry = await prisma.clockEntry.create({
    data: { userId: session.id, action, source: "qr" },
  });

  await writeAuditLog({
    actorId: session.id,
    action: `CLOCK_${action}`,
    entityType: "ClockEntry",
    entityId: entry.id,
    newValue: { action, timestamp: entry.timestamp },
  });

  await syncWorkEntryFromClock(session.id, entry.timestamp);

  revalidatePath("/mon-espace");
  revalidatePath("/equipe/pointage");
  revalidatePath("/equipe/heures");

  return {
    success: true,
    action,
    timestamp: entry.timestamp,
    userName: `${session.firstName} ${session.lastName}`,
  };
}

/**
 * Retourne le statut actuel d'un utilisateur pour aujourd'hui.
 */
export async function getClockStatus(userId: string): Promise<ClockStatus> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const lastEntry = await prisma.clockEntry.findFirst({
    where: { userId, timestamp: { gte: todayStart } },
    orderBy: { timestamp: "desc" },
  });

  if (!lastEntry) return "ABSENT";
  switch (lastEntry.action) {
    case "DEBUT_JOURNEE": return "PRESENT";
    case "DEBUT_PAUSE":   return "EN_PAUSE";
    case "FIN_PAUSE":     return "PRESENT";
    case "FIN_JOURNEE":   return "JOURNEE_TERMINEE";
    default:              return "ABSENT";
  }
}

/**
 * Retourne tous les pointages du jour pour un utilisateur.
 */
export async function getTodayClockEntries(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return prisma.clockEntry.findMany({
    where: { userId, timestamp: { gte: todayStart } },
    orderBy: { timestamp: "asc" },
  });
}

/**
 * Retourne tous les pointages du jour pour toutes les assistantes
 * (usage admin).
 */
export async function getAllTodayClockEntries() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return prisma.clockEntry.findMany({
    where: { timestamp: { gte: todayStart } },
    orderBy: { timestamp: "asc" },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, color: true } },
    },
  });
}

// ─── Actions admin ────────────────────────────────────────────────────────────

/**
 * L'admin peut modifier l'heure d'un pointage avec un motif obligatoire.
 */
export async function editClockEntryAction(
  entryId: string,
  newTimestamp: Date,
  reason: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) {
    return { error: "Non autorisé." };
  }
  if (!reason.trim()) {
    return { error: "Un motif de correction est requis." };
  }

  const entry = await prisma.clockEntry.findUnique({ where: { id: entryId } });
  if (!entry) return { error: "Pointage introuvable." };

  await prisma.clockEntry.update({
    where: { id: entryId },
    data: {
      timestamp: newTimestamp,
      originalTimestamp: entry.originalTimestamp ?? entry.timestamp,
      editedById: session.id,
      editReason: reason,
      source: "admin",
    },
  });

  await writeAuditLog({
    actorId: session.id,
    action: "CLOCK_EDIT",
    entityType: "ClockEntry",
    entityId: entryId,
    oldValue: { timestamp: entry.timestamp },
    newValue: { timestamp: newTimestamp, reason },
  });

  // La correction peut déplacer un pointage d'un jour à l'autre : on
  // resynchronise l'ancienne ET la nouvelle journée.
  await syncWorkEntryFromClock(entry.userId, entry.timestamp);
  await syncWorkEntryFromClock(entry.userId, newTimestamp);

  revalidatePath("/equipe/pointage");
  revalidatePath("/equipe/heures");
  return { success: true };
}

/**
 * L'admin peut ajouter manuellement un pointage oublié.
 */
export async function addClockEntryAction(
  userId: string,
  action: ClockAction,
  timestamp: Date,
  reason: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) {
    return { error: "Non autorisé." };
  }
  if (!reason.trim()) {
    return { error: "Un motif est requis pour un ajout manuel." };
  }

  const entry = await prisma.clockEntry.create({
    data: { userId, action, timestamp, source: "admin", editedById: session.id, editReason: reason },
  });

  await writeAuditLog({
    actorId: session.id,
    action: "CLOCK_ADD_MANUAL",
    entityType: "ClockEntry",
    entityId: entry.id,
    newValue: { userId, action, timestamp, reason },
  });

  await syncWorkEntryFromClock(userId, timestamp);

  revalidatePath("/equipe/pointage");
  revalidatePath("/equipe/heures");
  return { success: true };
}

/**
 * Version FormData-compatible de recordClockAction, pour useActionState.
 * Le type de pointage est passé en champ caché "clockAction".
 */
/**
 * Pointage par CODE PERSONNEL (borne QR publique, sans connexion).
 *
 * L'assistante scanne le QR, saisit son code à 4 chiffres et confirme :
 * la saisie du code + la confirmation valent signature électronique du
 * pointage (tracée dans l'audit). Aucune session n'est requise ; le code
 * identifie l'assistante parmi les comptes actifs.
 */
export async function recordClockByPinAction(
  _prev: ClockResult,
  formData: FormData
): Promise<ClockResult> {
  const action = formData.get("clockAction") as ClockAction | null;
  const pin = String(formData.get("pin") ?? "").trim();

  if (!action) return { error: "Action de pointage manquante." };
  if (!/^\d{4}$/.test(pin)) return { error: "Entrez votre code personnel à 4 chiffres." };

  // Identifie l'assistante active dont le code correspond (comparaison sur
  // le hash — les codes ne sont jamais stockés en clair).
  const candidates = await prisma.user.findMany({
    where: { role: "ASSISTANT", active: true, clockPinHash: { not: null } },
  });

  let matched: (typeof candidates)[number] | null = null;
  for (const c of candidates) {
    if (c.clockPinHash && (await verifyPassword(pin, c.clockPinHash))) {
      matched = c;
      break;
    }
  }

  if (!matched) {
    return { error: "Code personnel incorrect. Réessayez ou contactez l'administrateur." };
  }

  // Vérifie la cohérence de la succession des actions du jour.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const lastEntry = await prisma.clockEntry.findFirst({
    where: { userId: matched.id, timestamp: { gte: todayStart } },
    orderBy: { timestamp: "desc" },
  });
  const error = validateTransition(lastEntry?.action ?? null, action);
  if (error) return { error };

  const entry = await prisma.clockEntry.create({
    data: { userId: matched.id, action, source: "qr" },
  });

  await writeAuditLog({
    actorId: matched.id,
    action: `CLOCK_${action}`,
    entityType: "ClockEntry",
    entityId: entry.id,
    newValue: { action, timestamp: entry.timestamp, method: "pin_signature" },
  });

  await syncWorkEntryFromClock(matched.id, entry.timestamp);

  revalidatePath("/equipe/pointage");
  revalidatePath("/equipe/heures");

  return {
    success: true,
    action,
    timestamp: entry.timestamp,
    userName: `${matched.firstName} ${matched.lastName}`,
  };
}

export async function recordClockFromFormAction(
  _prev: ClockResult,
  formData: FormData
): Promise<ClockResult> {
  const action = formData.get("clockAction") as ClockAction | null;
  if (!action) return { error: "Action de pointage manquante." };
  return recordClockAction(action);
}
