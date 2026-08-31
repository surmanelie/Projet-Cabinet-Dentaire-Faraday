"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import { writeAuditLog, notifyUser } from "@/lib/audit";
import { computeMonthlySummary, computeDayMinutes, type MonthlySummary } from "@/lib/hours-engine";
import { getRulesConfig } from "@/lib/rules";
import { startOfParisDay, endOfParisDay, getParisDayOfWeek } from "@/lib/timezone";

/**
 * Recalcule le récapitulatif mensuel d'un utilisateur à partir des
 * WorkEntry / Absence / Adjustment réels. Le résultat n'est pas persisté
 * (MonthlyValidation ne stocke que le statut du workflow) : il est
 * recalculé à la demande à partir des données sources, qui restent la
 * seule source de vérité.
 */
export async function computeMonthlyRecap(userId: string, month: number, year: number): Promise<MonthlySummary> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { assistantProfile: true } });
  if (!user) throw new Error("Utilisateur introuvable");

  const start = startOfParisDay(new Date(year, month - 1, 1));
  const end = endOfParisDay(new Date(year, month - 1, new Date(year, month, 0).getDate()));

  const [entries, absences, adjustments, rules] = await Promise.all([
    prisma.workEntry.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    prisma.absence.findMany({
      where: { userId, status: "ACCEPTE", startDate: { lte: end }, endDate: { gte: start } },
    }),
    prisma.adjustment.findMany({ where: { userId, date: { gte: start, lte: end } } }),
    getRulesConfig(),
  ]);

  const contractType = user.assistantProfile?.contractType ?? "AUTRE";
  const contractHours = user.assistantProfile?.weeklyContractHours ?? 35;

  const workedMinutesByDay = entries
    .filter((e) => e.actualStart && e.actualEnd)
    .map((e) =>
      computeDayMinutes(
        { start: e.actualStart as string, end: e.actualEnd as string, breakMinutes: e.breakMinutes ?? 0 },
        rules.rounding
      )
    );

  // Une absence acceptée "consomme" les heures contractuelles des jours ouvrés
  // qu'elle couvre (lundi→vendredi), au prorata du contrat (contrat / 5 jours).
  // On compte chaque jour réel de la période (clippée au mois), pas le nombre
  // de demandes — un congé d'une semaine compte bien 5 jours.
  // FORMATION est traitée à part : ce n'est pas une journée entière "hors
  // contrat" mais un nombre d'heures précis (`Absence.hours`), jamais pointé
  // mais compté au contrat — jamais confondu avec les autres absences.
  const dailyHours = contractHours / 5;
  let absenceDays = 0;
  let formationHours = 0;
  for (const a of absences) {
    if (a.type === "FORMATION") {
      formationHours += a.hours ?? 0;
      continue;
    }
    const from = a.startDate > start ? a.startDate : start;
    const to = a.endDate < end ? a.endDate : end;
    let cursor = startOfParisDay(from);
    const lastDay = startOfParisDay(to);
    while (cursor <= lastDay) {
      const dow = getParisDayOfWeek(cursor);
      if (dow !== 0 && dow !== 6) absenceDays++;
      cursor = startOfParisDay(new Date(cursor.getTime() + 25 * 60 * 60 * 1000));
    }
  }
  const absenceHours = absenceDays * dailyHours;
  const adjustmentMinutes = adjustments.reduce((sum, a) => sum + a.minutes, 0);

  return computeMonthlySummary({
    contractType,
    weeklyContractHours: contractHours,
    workedMinutesByDay,
    absenceHours,
    formationHours,
    adjustmentMinutes,
    rules,
  });
}

/** Crée ou passe en statut "envoyé au salarié" le récapitulatif mensuel. */
export async function generateMonthlyRecapAction(userId: string, month: number, year: number) {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  const existing = await prisma.monthlyValidation.findUnique({
    where: { userId_month_year: { userId, month, year } },
  });

  const validation = existing
    ? await prisma.monthlyValidation.update({
        where: { id: existing.id },
        data: { status: "ENVOYE_AU_SALARIE" },
      })
    : await prisma.monthlyValidation.create({
        data: { userId, month, year, status: "ENVOYE_AU_SALARIE" },
      });

  await writeAuditLog({
    actorId: session.id,
    action: "GENERATE_MONTHLY_RECAP",
    entityType: "MonthlyValidation",
    entityId: validation.id,
    newValue: { month, year, status: validation.status },
  });

  await notifyUser(
    userId,
    "Récapitulatif mensuel disponible",
    `Votre récapitulatif de ${month}/${year} est prêt à être validé.`,
    "/mon-espace"
  );

  revalidatePath("/validations/mensuelles");
  return validation;
}

export async function employeeRespondMonthlyAction(
  validationId: string,
  decision: "VALIDE_SALARIE" | "REFUSE_SALARIE",
  comment?: string
) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const validation = await prisma.monthlyValidation.findUnique({ where: { id: validationId } });
  if (!validation || validation.userId !== session.id) throw new Error("Non autorisé");

  const updated = await prisma.monthlyValidation.update({
    where: { id: validationId },
    data: {
      status: decision,
      employeeComment: comment,
      employeeValidatedAt: decision === "VALIDE_SALARIE" ? new Date() : null,
    },
  });

  await writeAuditLog({
    actorId: session.id,
    action: "EMPLOYEE_RESPOND_MONTHLY",
    entityType: "MonthlyValidation",
    entityId: validationId,
    newValue: { decision, comment },
  });

  revalidatePath("/mon-espace");
  revalidatePath("/validations/mensuelles");
  return updated;
}

/** RH valide définitivement le mois après réponse du salarié. */
export async function rhValidateMonthlyAction(validationId: string, comment?: string) {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  const updated = await prisma.monthlyValidation.update({
    where: { id: validationId },
    data: { status: "VALIDE_RH", rhValidatedAt: new Date(), rhComment: comment },
  });

  await writeAuditLog({
    actorId: session.id,
    action: "RH_VALIDATE_MONTHLY",
    entityType: "MonthlyValidation",
    entityId: validationId,
  });

  revalidatePath("/validations/mensuelles");
  return updated;
}

/** Verrouille le mois : plus aucune modification possible sur les jours concernés. */
export async function lockMonthlyValidationAction(validationId: string) {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  const updated = await prisma.monthlyValidation.update({
    where: { id: validationId },
    data: { status: "VERROUILLE", lockedAt: new Date() },
  });

  const start = new Date(updated.year, updated.month - 1, 1);
  const end = new Date(updated.year, updated.month, 0, 23, 59, 59);
  await prisma.workEntry.updateMany({
    where: { userId: updated.userId, date: { gte: start, lte: end } },
    data: { locked: true },
  });

  await writeAuditLog({
    actorId: session.id,
    action: "LOCK_MONTHLY_VALIDATION",
    entityType: "MonthlyValidation",
    entityId: validationId,
  });

  revalidatePath("/validations/mensuelles");
  return updated;
}
