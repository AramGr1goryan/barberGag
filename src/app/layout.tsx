import type { Metadata } from "next";
import "./globals.css";
import { adminService } from "@/services/admin.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Gagik Ghambaryan | Luxury Men's Barbershop Yerevan",
  description: "Exclusive gentlemen's barbershop in Yerevan. Precision haircuts, royal beard sculpting, and bespoke grooming by master barber Gagik Ghambaryan.",
  openGraph: {
    title: "Gagik Ghambaryan | Luxury Barbershop",
    description: "Precision, discretion, and bespoke craftsmanship in the heart of Yerevan.",
    siteName: "Gagik Ghambaryan Barbershop",
    locale: "hy_AM",
    type: "website",
  },
};

import { RouteProgressLoader } from "@/components/ui/RouteProgressLoader";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch dynamic theme settings from database for live admin theme control
  let theme;
  try {
    theme = await adminService.getThemeSettings();
  } catch {
    // Fallback if db during build
  }

  const themeStyle = {
    "--background": theme?.background || "#0d0d0f",
    "--foreground": theme?.foreground || "#f4f4f6",
    "--surface": theme?.surface || "#16161a",
    "--surface-elevated": theme?.surfaceElevated || "#1f1f24",
    "--border": theme?.border || "#2a2a32",
    "--muted": theme?.muted || "#8e8e9c",
    "--accent": theme?.accent || "#c5a880",
    "--accent-foreground": theme?.accentForeground || "#000000",
  } as React.CSSProperties;

  return (
    <html lang="hy" style={themeStyle}>
      <body className="bg-background text-foreground antialiased selection:bg-accent selection:text-accent-foreground min-h-screen flex flex-col">
        <RouteProgressLoader />
        {children}
      </body>
    </html>
  );
}
