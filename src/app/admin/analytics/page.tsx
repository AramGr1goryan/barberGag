import React from "react";
import { authService } from "@/services/auth.service";
import { FinancialAnalyticsDashboard } from "@/components/admin/analytics/FinancialAnalyticsDashboard";

export const metadata = {
  title: "Financial Analytics | Admin Panel",
  description: "Barbershop Financial Intelligence and Business Analytics",
};

export default async function AdminFinancialAnalyticsPage() {
  await authService.requireAdmin();

  return <FinancialAnalyticsDashboard />;
}
