import React from "react";
import { authService } from "@/services/auth.service";
import { PortfolioAdminManager } from "@/components/admin/PortfolioAdminManager";

export default async function AdminPortfolioPage() {
  await authService.requireAdmin();
  return <PortfolioAdminManager />;
}
