import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

console.log("[prisma init]", { hasDatabaseUrl: Boolean(process.env.DATABASE_URL) });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
