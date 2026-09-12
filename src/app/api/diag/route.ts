import { NextResponse } from "next/server";
import { prisma, getResolvedDatabaseUrl } from "@/lib/prisma";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  let rawMaskedUrl = "none";
  try {
    if (dbUrl) {
      const u = new URL(dbUrl);
      rawMaskedUrl = `${u.protocol}//${u.username}:****@${u.host}${u.pathname}?${u.searchParams.toString()}`;
    }
  } catch {
    rawMaskedUrl = "invalid-url";
  }

  const resolvedUrl = getResolvedDatabaseUrl();
  let resolvedMasked = "none";
  try {
    const ru = new URL(resolvedUrl);
    resolvedMasked = `${ru.protocol}//${ru.username}:****@${ru.host}${ru.pathname}`;
  } catch {
    resolvedMasked = "invalid-url";
  }

  let dbInfo: any = null;
  let tables: any = [];
  let counts: any = null;
  let error: string | null = null;
  try {
    dbInfo = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    tables = await prisma.$queryRaw`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    const [users, services, portfolio, theme] = await Promise.all([
      prisma.user.count(),
      prisma.service.count(),
      prisma.portfolioImage.count(),
      prisma.themeSettings.findUnique({ where: { id: "default" } }),
    ]);
    counts = { users, services, portfolio, hasTheme: !!theme };
  } catch (e: any) {
    error = e.message;
  }

  return NextResponse.json({
    rawEnvDatabaseUrl: rawMaskedUrl,
    resolvedDatabaseUrl: resolvedMasked,
    counts,
    dbInfo,
    tables,
    error,
  });
}
