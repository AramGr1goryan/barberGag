export const LOCALES = ["hy", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "hy";

export const LOCALE_LABELS: Record<Locale, string> = {
  hy: "ՀԱՅ",
  ru: "РУС",
  en: "ENG",
};

export function isValidLocale(locale: string): locale is Locale {
  return LOCALES.includes(locale as Locale);
}
