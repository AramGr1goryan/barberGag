import React from "react";
import { authService } from "@/services/auth.service";
import { adminService } from "@/services/admin.service";
import { DashboardOverview } from "@/components/admin/DashboardOverview";

export default async function AdminDashboardPage() {
  await authService.requireAdmin();
  const metrics = await adminService.getDashboardMetrics();

  return <DashboardOverview metrics={metrics} />;
}

