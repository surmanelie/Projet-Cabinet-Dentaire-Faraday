"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAuditLog, notifyUser } from "@/lib/audit";
import { isAdminOrRh } from "@/lib/permissions";
import { startOfParisDay } from "@/lib/timezone";
import type { AbsenceType } from "@prisma/client";

export type AbsenceFormResult = { error?: string; success?: boolean };

const ABSENCE_LABELS: Record<string, string> = {
  CONGE_PAYE: "Congé payé",
  ARRET_MALADIE: "Arrêt maladie",
  ABSENCE_EXCEPTIONNELLE: "Absence exceptionnelle",
  ABSENCE_NON_REMUNEREE: "Absence non rémunérée",
  FORMATION: "Formation",
  RECUPERATION: "Récupération",
  AUTRE: "Absence",
};

/**
 * Renvoie tous les jours (minuit Paris) entre deux dates incluses — même
 * convention que `WorkEntry.date` partout ailleurs (pointage, planning),
 * sinon une même journée calendaire produirait deux valeurs différentes et
 * dupliquerait la ligne au lieu de la marquer "absence".
 */
function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let d = startOfParisDay(start);
  const last = startOfParisDay(end);
  while (d <= last) {
    days.push(d);
    d = startOfParisDay(new Date(d.getTime() + 25 * 60 * 60 * 1000));
  }
  return days;
}

/**
 * Inscrit un congé accepté dans l'emploi du temps réel : chaque jour de la
 * période devient une journée "absence" (aucune heure attendue), visible dans
 * le planning. Ne touche pas une journée déjà verrouillée.
 */
async function markAbsenceInSchedule(userId: string, start: Date, end: Date, type: string, hours?: number | null) {
  const label = type === "FORMATION" && hours ? `Formation (${hours}h)` : ABSENCE_LABELS[type] ?? "Absence";
  for (const day of eachDay(start, end)) {
    const existing = await prisma.workEntry.findUnique({ where: { userId_date: { userId, date: day } } });
    if (existing?.locked) continue;
    await prisma.workEntry.upsert({
      where: { userId_date: { userId, date: day } },
      update: {
        source: "absence",
        comment: label,
        plannedStart: null,
        plannedEnd: null,
        actualStart: null,
        actualEnd: null,
        breakMinutes: 0,
      },
      create: { userId, date: day, source: "absence", comment: label, status: "PRE_REMPLI" },
    });
  }
}

/** Retire les marques d'absence de l'emploi du temps (congé refusé ou annulé). */
async function clearAbsenceFromSchedule(userId: string, start: Date, end: Date) {
  await prisma.workEntry.deleteMany({
    where: { userId, source: "absence", date: { in: eachDay(start, end) } },
  });
}

export async function requestAbsenceAction(
  _prev: AbsenceFormResult,
  formData: FormData
): Promise<AbsenceFormResult> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const type = String(formData.get("type") ?? "") as AbsenceType;
  const startDate = String(formData.get("startDate") ?? "");
  const isFormation = type === "FORMATION";
  // Une formation est un jour précis avec un nombre d'heures, pas une plage
  // de dates — le formulaire ne soumet donc pas de endDate dans ce cas.
  const endDate = isFormation ? startDate : String(formData.get("endDate") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!type || !startDate || !endDate) {
    return { error: "Merci de renseigner le type et les dates de l'absence." };
  }

  let hours: number | null = null;
  if (isFormation) {
    hours = Number(formData.get("hours") ?? 0);
    if (!hours || hours <= 0 || hours > 24) {
      return { error: "Merci d'indiquer un nombre d'heures de formation valide." };
    }
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Dates invalides." };
  }
  if (end < start) {
    return { error: "La date de fin doit être après la date de début." };
  }

  const absence = await prisma.absence.create({
    data: {
      userId: session.id,
      type,
      startDate: start,
      endDate: end,
      hours,
      comment: comment || null,
      status: "DEMANDE",
    },
  });

  await writeAuditLog({ actorId: session.id, action: "REQUEST_ABSENCE", entityType: "Absence", entityId: absence.id });

  const reviewers = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "RH"] }, active: true } });
  await Promise.all(
    reviewers.map((r) => notifyUser(r.id, "Nouvelle demande d'absence", `${session.firstName} ${session.lastName} a fait une demande.`, "/absences"))
  );

  revalidatePath("/absences");
  return { success: true };
}

export type FormationFormResult = { error?: string; success?: boolean };

/**
 * L'organisateur ajoute directement une journée de formation pour une
 * assistante (sans passer par le workflow demande → validation, puisque
 * c'est l'admin elle-même qui la programme). Mêmes effets qu'une absence
 * FORMATION acceptée : comptée au contrat, jamais pointée.
 */
export async function addFormationForAssistantAction(
  _prev: FormationFormResult,
  formData: FormData
): Promise<FormationFormResult> {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) return { error: "Non autorisé." };

  const userId = String(formData.get("userId") ?? "");
  const date = String(formData.get("date") ?? "");
  const hours = Number(formData.get("hours") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!userId || !date) return { error: "Merci de choisir l'assistante et la date." };
  if (!hours || hours <= 0 || hours > 24) return { error: "Merci d'indiquer un nombre d'heures valide." };

  const day = new Date(date);
  if (Number.isNaN(day.getTime())) return { error: "Date invalide." };

  const absence = await prisma.absence.create({
    data: {
      userId,
      type: "FORMATION",
      startDate: day,
      endDate: day,
      hours,
      comment: comment || null,
      status: "ACCEPTE",
      reviewedById: session.id,
      reviewedAt: new Date(),
    },
  });

  await markAbsenceInSchedule(userId, day, day, "FORMATION", hours);

  await writeAuditLog({ actorId: session.id, action: "ADD_FORMATION", entityType: "Absence", entityId: absence.id, newValue: { userId, date, hours } });
  await notifyUser(userId, "Formation programmée", `Une formation de ${hours}h a été ajoutée à votre planning.`, "/absences");

  revalidatePath("/absences");
  revalidatePath("/planning");
  revalidatePath("/equipe/heures");
  revalidatePath("/mon-espace");
  return { success: true };
}

/**
 * Variante en masse de `addFormationForAssistantAction`, utilisée par
 * l'édition en masse du planning (sélection de plusieurs jours dans
 * l'agenda admin) : une journée de formation de `hours` heures est créée et
 * auto-acceptée pour chaque date sélectionnée.
 */
export async function bulkAddFormationAction(
  userId: string,
  dates: string[],
  hours: number,
  comment?: string
): Promise<FormationFormResult> {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) return { error: "Non autorisé." };
  if (dates.length === 0) return { error: "Aucun jour sélectionné." };
  if (!hours || hours <= 0 || hours > 24) return { error: "Merci d'indiquer un nombre d'heures valide." };

  for (const dateStr of dates) {
    const day = new Date(dateStr);
    if (Number.isNaN(day.getTime())) continue;
    await prisma.absence.create({
      data: {
        userId,
        type: "FORMATION",
        startDate: day,
        endDate: day,
        hours,
        comment: comment || null,
        status: "ACCEPTE",
        reviewedById: session.id,
        reviewedAt: new Date(),
      },
    });
    await markAbsenceInSchedule(userId, day, day, "FORMATION", hours);
  }

  await writeAuditLog({ actorId: session.id, action: "BULK_ADD_FORMATION", entityType: "Absence", entityId: userId, newValue: { dates, hours } });
  await notifyUser(userId, "Formation programmée", `${dates.length} jour${dates.length > 1 ? "s" : ""} de formation (${hours}h chacun) ${dates.length > 1 ? "ont été ajoutés" : "a été ajouté"} à votre planning.`, "/absences");

  revalidatePath("/absences");
  revalidatePath("/planning");
  revalidatePath("/equipe/heures");
  revalidatePath("/mon-espace");
  return { success: true };
}

export async function reviewAbsenceAction(absenceId: string, decision: "ACCEPTE" | "REFUSE") {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  const target = await prisma.absence.findUnique({ where: { id: absenceId } });
  if (!target) throw new Error("Demande introuvable");

  const absence = await prisma.absence.update({
    where: { id: absenceId },
    data: { status: decision, reviewedById: session.id, reviewedAt: new Date() },
  });

  // Mise à jour automatique de l'emploi du temps selon la décision.
  if (decision === "ACCEPTE") {
    await markAbsenceInSchedule(absence.userId, absence.startDate, absence.endDate, absence.type, absence.hours);
  } else {
    await clearAbsenceFromSchedule(absence.userId, absence.startDate, absence.endDate);
  }

  await writeAuditLog({ actorId: session.id, action: `ABSENCE_${decision}`, entityType: "Absence", entityId: absenceId });
  await notifyUser(
    absence.userId,
    decision === "ACCEPTE" ? "Absence acceptée" : "Absence refusée",
    decision === "ACCEPTE"
      ? "Votre absence a été acceptée et ajoutée à votre planning."
      : "Votre demande d'absence a été refusée.",
    "/absences"
  );

  revalidatePath("/absences");
  revalidatePath("/planning");
  revalidatePath("/equipe/heures");
  revalidatePath("/mon-espace");
}

export async function cancelAbsenceAction(absenceId: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const absence = await prisma.absence.findUnique({ where: { id: absenceId } });
  if (!absence) throw new Error("Absence introuvable");
  if (absence.userId !== session.id && !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  await prisma.absence.update({ where: { id: absenceId }, data: { status: "ANNULE" } });
  // Si le congé était accepté, on le retire du planning.
  if (absence.status === "ACCEPTE") {
    await clearAbsenceFromSchedule(absence.userId, absence.startDate, absence.endDate);
  }
  await writeAuditLog({ actorId: session.id, action: "CANCEL_ABSENCE", entityType: "Absence", entityId: absenceId });
  revalidatePath("/absences");
  revalidatePath("/planning");
  revalidatePath("/mon-espace");
}
