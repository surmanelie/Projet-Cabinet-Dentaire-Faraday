"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getUnreadNotifications() {
  const session = await getSession();
  if (!session) return [];
  return prisma.notification.findMany({
    where: { userId: session.id, read: false },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function markNotificationReadAction(notificationId: string) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.id },
    data: { read: true },
  });

  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction() {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  await prisma.notification.updateMany({
    where: { userId: session.id, read: false },
    data: { read: true },
  });

  revalidatePath("/", "layout");
}
