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
        {/* Soft, Eye-Friendly Ambient Glows */}
        <div className="fixed -top-48 -left-48 w-96 h-96 bg-accent/[0.05] rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed top-1/3 -right-48 w-96 h-96 bg-indigo-400/[0.03] rounded-full blur-[160px] pointer-events-none" />
        <div className="fixed -bottom-48 left-1/3 w-96 h-96 bg-accent/[0.03] rounded-full blur-[150px] pointer-events-none" />

        {/* Desktop Sidebar with localized links & language switcher */}
        <AdminSidebar />

        {/* Main Workspace with sticky top bar containing prominent language switcher */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <AdminTopHeader />
          <main className="flex-1 p-4 sm:p-7 lg:p-9 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminI18nProvider>
  );
}
