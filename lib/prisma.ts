import { PrismaClient } from "@prisma/client";

// Singleton du client Prisma pour éviter d'épuiser les connexions SQLite
// en développement (hot-reload Next.js).
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
