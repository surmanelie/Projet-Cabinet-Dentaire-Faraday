"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAdminOrRh } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

export async function deleteScheduleTemplateAction(templateId: string) {
  const session = await getSession();
  if (!session || !isAdminOrRh(session.role)) throw new Error("Non autorisé");

  const template = await prisma.scheduleTemplate.delete({ where: { id: templateId } });
  await writeAuditLog({
    actorId: session.id,
    action: "DELETE_SCHEDULE_TEMPLATE",
    entityType: "ScheduleTemplate",
    entityId: templateId,
    oldValue: template,
  });
  revalidatePath("/planning");
}
