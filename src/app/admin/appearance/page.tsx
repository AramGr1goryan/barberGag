import React from "react";
import { authService } from "@/services/auth.service";
import { ThemeManager } from "@/components/admin/ThemeManager";

export default async function AdminAppearancePage() {
  await authService.requireAdmin();
  return <ThemeManager />;
}
