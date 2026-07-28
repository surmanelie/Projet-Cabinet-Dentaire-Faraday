"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAuditLog, notifyUser } from "@/lib/audit";
import { isAdminOrRh } from "@/lib/permissions";
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

/** Renvoie tous les jours (à minuit) entre deux dates incluses. */
function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (d <= last) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/**
 * Inscrit un congé accepté dans l'emploi du temps réel : chaque jour de la
 * période devient une journée "absence" (aucune heure attendue), visible dans
 * le planning. Ne touche pas une journée déjà verrouillée.
 */
async function markAbsenceInSchedule(userId: string, start: Date, end: Date, type: string) {
  const label = ABSENCE_LABELS[type] ?? "Absence";
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
  const endDate = String(formData.get("endDate") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!type || !startDate || !endDate) {
    return { error: "Merci de renseigner le type et les dates de l'absence." };
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

export async function reviewAbsenceAction(absenceId: string, decision: "ACCEPTE" | "REFUSE") {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  // Isolation : le demandeur doit appartenir à la même entreprise que le valideur.
  const target = await prisma.absence.findUnique({ where: { id: absenceId }, include: { user: { select: { companyId: true } } } });
  if (!target) throw new Error("Demande introuvable");
  const me = await prisma.user.findUnique({ where: { id: session.id }, select: { companyId: true } });
  if ((target.user.companyId ?? null) !== (me?.companyId ?? null)) throw new Error("Non autorisé");

  const absence = await prisma.absence.update({
    where: { id: absenceId },
    data: { status: decision, reviewedById: session.id, reviewedAt: new Date() },
  });

  // Mise à jour automatique de l'emploi du temps selon la décision.
  if (decision === "ACCEPTE") {
    await markAbsenceInSchedule(absence.userId, absence.startDate, absence.endDate, absence.type);
  } else {
    await clearAbsenceFromSchedule(absence.userId, absence.startDate, absence.endDate);
  }

  await writeAuditLog({ actorId: session.id, action: `ABSENCE_${decision}`, entityType: "Absence", entityId: absenceId });
  await notifyUser(
    absence.userId,
    decision === "ACCEPTE" ? "Congé accepté" : "Congé refusé",
    decision === "ACCEPTE"
      ? "Votre congé a été accepté et ajouté à votre planning."
      : "Votre demande de congé a été refusée.",
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
