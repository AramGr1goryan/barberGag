import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  let maskedUrl = "none";
  try {
    if (dbUrl) {
      const u = new URL(dbUrl);
      maskedUrl = `${u.protocol}//${u.username}:****@${u.host}${u.pathname}?${u.searchParams.toString()}`;
    }
  } catch {
    maskedUrl = "invalid-url";
  }

  let dbInfo: any = null;
  let tables: any = [];
  let error: string | null = null;
  try {
    dbInfo = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    tables = await prisma.$queryRaw`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
  } catch (e: any) {
    error = e.message;
  }

  return NextResponse.json({
    maskedUrl,
    hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    neonBranch: process.env.NEON_BRANCH || null,
    dbInfo,
    tables,
    error,
  });
}
