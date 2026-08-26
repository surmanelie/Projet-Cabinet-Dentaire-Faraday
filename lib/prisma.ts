import { PrismaClient } from "@prisma/client";

// Singleton du client Prisma pour éviter d'épuiser le pool de connexions
// PostgreSQL en développement (hot-reload Next.js).
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
