import React from "react";
import { authService } from "@/services/auth.service";
import { ContentManager } from "@/components/admin/ContentManager";

export default async function AdminContentPage() {
  await authService.requireAdmin();
  return <ContentManager />;
}
