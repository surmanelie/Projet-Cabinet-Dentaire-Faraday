"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notifyUser } from "@/lib/audit";

export type MessageResult = { error?: string; success?: boolean };

/** Liste des personnes avec qui échanger (tous les comptes actifs sauf soi). */
export async function getContacts(selfId: string) {
  const users = await prisma.user.findMany({
    where: { active: true, id: { not: selfId } },
    select: { id: true, firstName: true, lastName: true, role: true, color: true },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  const unread = await prisma.message.groupBy({
    by: ["senderId"],
    where: { recipientId: selfId, read: false },
    _count: { _all: true },
  });
  const unreadMap = new Map(unread.map((u) => [u.senderId, u._count._all]));

  return users.map((u) => ({ ...u, unread: unreadMap.get(u.id) ?? 0 }));
}

/** Messages échangés avec une personne ; marque comme lus ceux reçus d'elle. */
export async function getConversation(selfId: string, otherId: string) {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: selfId, recipientId: otherId },
        { senderId: otherId, recipientId: selfId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  await prisma.message.updateMany({
    where: { senderId: otherId, recipientId: selfId, read: false },
    data: { read: true },
  });

  return messages;
}

/** Nombre total de messages non lus (pour la pastille du menu). */
export async function getUnreadMessageCount(selfId: string): Promise<number> {
  return prisma.message.count({ where: { recipientId: selfId, read: false } });
}

/** Envoi d'un message (depuis un formulaire). */
export async function sendMessageAction(_prev: MessageResult, formData: FormData): Promise<MessageResult> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const recipientId = String(formData.get("recipientId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!recipientId) return { error: "Destinataire manquant." };
  if (!body) return { error: "Le message est vide." };
  if (body.length > 2000) return { error: "Message trop long (2000 caractères max)." };

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient || !recipient.active) return { error: "Destinataire introuvable." };

  await prisma.message.create({ data: { senderId: session.id, recipientId, body } });
  await notifyUser(recipientId, "Nouveau message", `${session.firstName} ${session.lastName} vous a écrit.`, `/messages?to=${session.id}`);

  revalidatePath("/messages");
  return { success: true };
}
