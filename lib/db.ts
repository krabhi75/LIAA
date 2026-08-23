import { PrismaClient } from "@prisma/client";

export function prismaConfigured(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) return false;
  if (process.env.VERCEL && (url.startsWith("file:") || url.includes("dev.db"))) {
    return false;
  }
  return true;
}

const globalForPrisma = globalThis as typeof globalThis & {
  __molvaaniPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.__molvaaniPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__molvaaniPrisma = prisma;
}
