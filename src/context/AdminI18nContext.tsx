"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AdminDictionary, AdminLocale, getAdminDictionary, DEFAULT_ADMIN_LOCALE } from "@/i18n/admin";

interface AdminI18nContextType {
  locale: AdminLocale;
  setLocale: (loc: AdminLocale) => void;
  t: AdminDictionary;
}

const AdminI18nContext = createContext<AdminI18nContextType | null>(null);

export function AdminI18nProvider({
  children,
  initialLocale = DEFAULT_ADMIN_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: AdminLocale;
}) {
  const [locale, setLocaleState] = useState<AdminLocale>(initialLocale);

  useEffect(() => {
    // Read from localStorage or cookie on mount
    const saved = localStorage.getItem("admin_locale") as AdminLocale | null;
    if (saved && (saved === "hy" || saved === "ru" || saved === "en")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: AdminLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem("admin_locale", newLocale);
    document.cookie = `admin_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const t = getAdminDictionary(locale);

  return (
    <AdminI18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n() {
  const context = useContext(AdminI18nContext);
  if (!context) {
    // Fallback safe dictionary if used outside provider
    return {
      locale: DEFAULT_ADMIN_LOCALE,
      setLocale: () => {},
      t: getAdminDictionary(DEFAULT_ADMIN_LOCALE),
    };
  }
  return context;
}
