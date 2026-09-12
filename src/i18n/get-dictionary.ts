import { Locale, DEFAULT_LOCALE } from "./config";

const dictionaries = {
  hy: () => import("@/messages/hy.json").then((module) => module.default),
  ru: () => import("@/messages/ru.json").then((module) => module.default),
  en: () => import("@/messages/en.json").then((module) => module.default),
};

export async function getDictionary(locale: string) {
  const selectedLocale = (locale in dictionaries ? locale : DEFAULT_LOCALE) as Locale;
  return dictionaries[selectedLocale]();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
