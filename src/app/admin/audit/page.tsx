import React from "react";
import { authService } from "@/services/auth.service";
import { prisma } from "@/lib/prisma";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

export default async function AdminAuditPage() {
  await authService.requireAdmin();

  const logs = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  const serialized = logs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  return <AuditLogViewer logs={serialized} />;
}

