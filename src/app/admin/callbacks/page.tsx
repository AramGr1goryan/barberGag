import React from "react";
import { authService } from "@/services/auth.service";
import { CallbacksManager } from "@/components/admin/CallbacksManager";

export default async function AdminCallbacksPage() {
  await authService.requireAdmin();
  return <CallbacksManager />;
}
