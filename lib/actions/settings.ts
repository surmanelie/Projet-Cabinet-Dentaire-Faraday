"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getCabinetSettings } from "@/lib/rules";

export async function updateCabinetSettingsAction(_prev: unknown, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "Non autorisé" };

  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim() || null;
  const timezone = String(formData.get("timezone") || "Europe/Paris");
  const allowFutureEdits = formData.get("allowFutureEdits") === "on";
  const allowLeaveRequests = formData.get("allowLeaveRequests") === "on";

  if (!name) return { error: "Le nom du cabinet est requis." };

  const current = await getCabinetSettings();
  const updated = await prisma.cabinetSettings.update({
    where: { id: current.id },
    data: { name, address, timezone, allowFutureEdits, allowLeaveRequests },
  });

  await writeAuditLog({
    actorId: session.id,
    action: "UPDATE_CABINET_SETTINGS",
    entityType: "CabinetSettings",
    entityId: updated.id,
    oldValue: current,
    newValue: updated,
  });

  revalidatePath("/parametres");
  return { success: true };
}

export async function updateRulesConfigAction(_prev: unknown, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { error: "Non autorisé" };

  const rules = {
    fullTimeWeeklyThreshold: Number(formData.get("fullTimeWeeklyThreshold")),
    overtimeTier1UpToHours: Number(formData.get("overtimeTier1UpToHours")),
    overtimeTier1Rate: Number(formData.get("overtimeTier1Rate")),
    overtimeTier2Rate: Number(formData.get("overtimeTier2Rate")),
    partTimeComplementaryTier1Pct: Number(formData.get("partTimeComplementaryTier1Pct")),
    partTimeComplementaryTier1Rate: Number(formData.get("partTimeComplementaryTier1Rate")),
    partTimeComplementaryTier2Rate: Number(formData.get("partTimeComplementaryTier2Rate")),
    rounding: String(formData.get("rounding") || "EXACT"),
  };

  const current = await getCabinetSettings();
  const updated = await prisma.cabinetSettings.update({
    where: { id: current.id },
    data: { rulesConfigJson: JSON.stringify(rules), roundingPolicy: rules.rounding },
  });

  await writeAuditLog({
    actorId: session.id,
    action: "UPDATE_RULES_CONFIG",
    entityType: "CabinetSettings",
    entityId: updated.id,
    oldValue: current.rulesConfigJson,
    newValue: rules,
  });

  revalidatePath("/parametres/regles");
  return { success: true };
}
