import { AdminDictionary, AdminLocale } from "./types";
import { adminHy } from "./hy";
import { adminRu } from "./ru";
import { adminEn } from "./en";

export * from "./types";

export const adminDictionaries: Record<AdminLocale, AdminDictionary> = {
  hy: adminHy,
  ru: adminRu,
  en: adminEn,
};

export const ADMIN_LOCALES: AdminLocale[] = ["hy", "ru", "en"];
export const DEFAULT_ADMIN_LOCALE: AdminLocale = "hy";

export const ADMIN_LOCALE_LABELS: Record<AdminLocale, { short: string; full: string }> = {
  hy: { short: "ՀԱՅ", full: "Հայերեն" },
  ru: { short: "РУС", full: "Русский" },
  en: { short: "ENG", full: "English" },
};

export function getAdminDictionary(locale: AdminLocale = DEFAULT_ADMIN_LOCALE): AdminDictionary {
  return adminDictionaries[locale] || adminDictionaries[DEFAULT_ADMIN_LOCALE];
}
