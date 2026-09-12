import { PrismaClient } from "@prisma/client";

// Neon PostgreSQL connection string (production pooler)
const NEON_DEFAULT_URL =
  "postgresql://neondb_owner:npg_gbNDOhp1B9js@ep-green-bar-axiqzavb-pooler.c-4.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

export function getResolvedDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  // If DATABASE_URL is missing or points to the empty/stale db.prisma.io placeholder
  if (!envUrl || envUrl.includes("db.prisma.io")) {
    return process.env.NEON_DATABASE_URL || NEON_DEFAULT_URL;
  }
  return envUrl;
}

const resolvedUrl = getResolvedDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
