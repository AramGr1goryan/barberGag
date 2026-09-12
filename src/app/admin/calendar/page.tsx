import React from "react";
import { authService } from "@/services/auth.service";
import { CalendarManager } from "@/components/admin/CalendarManager";

export default async function AdminCalendarPage() {
  await authService.requireAdmin();
  return <CalendarManager />;
}
