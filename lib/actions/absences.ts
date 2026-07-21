"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAuditLog, notifyUser } from "@/lib/audit";
import { isAdminOrRh } from "@/lib/permissions";
import type { AbsenceType } from "@prisma/client";

export type AbsenceFormResult = { error?: string; success?: boolean };

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

  const absence = await prisma.absence.create({
    data: {
      userId: session.id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
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

  const absence = await prisma.absence.update({
    where: { id: absenceId },
    data: { status: decision, reviewedById: session.id, reviewedAt: new Date() },
  });

  await writeAuditLog({ actorId: session.id, action: `ABSENCE_${decision}`, entityType: "Absence", entityId: absenceId });
  await notifyUser(
    absence.userId,
    decision === "ACCEPTE" ? "Absence acceptée" : "Absence refusée",
    "La décision a été prise par le RH.",
    "/absences"
  );

  revalidatePath("/absences");
}

export async function cancelAbsenceAction(absenceId: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const absence = await prisma.absence.findUnique({ where: { id: absenceId } });
  if (!absence) throw new Error("Absence introuvable");
  if (absence.userId !== session.id && !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  await prisma.absence.update({ where: { id: absenceId }, data: { status: "ANNULE" } });
  await writeAuditLog({ actorId: session.id, action: "CANCEL_ABSENCE", entityType: "Absence", entityId: absenceId });
  revalidatePath("/absences");
}
