import React from "react";
import { authService } from "@/services/auth.service";
import { ServicesManager } from "@/components/admin/ServicesManager";

export default async function AdminServicesPage() {
  await authService.requireAdmin();
  return <ServicesManager />;
}
