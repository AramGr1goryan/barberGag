import React from "react";
import { notFound } from "next/navigation";
import { isValidLocale, Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/context";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { authService } from "@/services/auth.service";
import { fontService } from "@/services/font.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  let dict = await getDictionary(locale);
  let session = null;
  let fontSettings = fontService.getDefaultFontSettings();

  try {
    [session, fontSettings] = await Promise.all([
      authService.getSession(),
      fontService.getFontSettings(),
    ]);
  } catch (err) {
    console.error("Error fetching session/fonts:", err);
  }

  const currentUser = session ? { name: session.name, role: session.role } : null;

  let activeFont = fontSettings.fontHy;
  if (locale === "ru") activeFont = fontSettings.fontRu;
  else if (locale === "en") activeFont = fontSettings.fontEn;

  if (activeFont === "Custom" && fontSettings.customFontName) {
    activeFont = fontSettings.customFontName;
  }

  return (
    <I18nProvider locale={locale as Locale} dictionary={dict}>
      <style>{`
        :root {
          --font-sans: '${activeFont}', 'Plus Jakarta Sans', system-ui, sans-serif;
          --font-display: '${activeFont}', 'Cinzel', serif;
        }
      `}</style>
      {fontSettings.customFontUrl && (
        <link rel="stylesheet" href={fontSettings.customFontUrl} />
      )}
      <Navbar
        locale={locale as Locale}
        dict={dict.nav}
        user={currentUser}
      />
      <main className="flex-grow pt-20 pb-24 md:pb-0">{children}</main>
      <MobileBottomNav locale={locale as Locale} user={currentUser} />
    </I18nProvider>
  );
}

