import React from "react";
import { authService } from "@/services/auth.service";
import { BookingsManager } from "@/components/admin/BookingsManager";

export default async function AdminBookingsPage() {
  await authService.requireAdmin();
  return <BookingsManager />;
}
