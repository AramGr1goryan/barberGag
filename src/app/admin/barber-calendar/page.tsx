import React from "react";
import { authService } from "@/services/auth.service";
import { BarberCalendarManager } from "@/components/admin/BarberCalendarManager";

export default async function BarberCalendarPage() {
  await authService.requireAdmin();
  return <BarberCalendarManager />;
}
