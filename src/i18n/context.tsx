"use client";

import React, { createContext, useContext } from "react";
import { Locale } from "./config";

type NestedRecord = Record<string, unknown>;

interface I18nContextType {
  locale: Locale;
  dictionary: NestedRecord;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: NestedRecord;
  children: React.ReactNode;
}) {
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let current: unknown = dictionary;

    for (const k of keys) {
      if (current && typeof current === "object" && k in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return key; // Fallback to key if not found
      }
    }

    if (typeof current !== "string") {
      return key;
    }

    let result = current;
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
      });
    }

    return result;
  };

  return (
    <I18nContext.Provider value={{ locale, dictionary, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
