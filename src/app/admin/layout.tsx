import React from "react";
import { cookies } from "next/headers";
import { authService } from "@/services/auth.service";
import { AdminI18nProvider } from "@/context/AdminI18nContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopHeader } from "@/components/admin/AdminTopHeader";
import { AdminLocale, DEFAULT_ADMIN_LOCALE } from "@/i18n/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get("admin_locale")?.value as AdminLocale;
  const initialLocale: AdminLocale =
    savedLocale === "hy" || savedLocale === "ru" || savedLocale === "en"
      ? savedLocale
      : DEFAULT_ADMIN_LOCALE;

  const session = await authService.getSession();

  // If unauthenticated (e.g. login page), render cleanly without admin navigation
  if (!session || session.role !== "ADMIN") {
    return (
      <AdminI18nProvider initialLocale={initialLocale}>
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </AdminI18nProvider>
    );
  }

  return (
    <AdminI18nProvider initialLocale={initialLocale}>
      <div className="min-h-screen flex bg-[#14161f] text-foreground relative overflow-hidden">
        {/* Main Workspace with sticky top bar */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 w-full">
          <AdminTopHeader />
          <main className="flex-1 p-4 sm:p-7 lg:p-9 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminI18nProvider>
  );
}
