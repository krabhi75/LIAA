import { PrismaClient } from "@prisma/client";

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
