"use client";

import React from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { ADMIN_LOCALES, ADMIN_LOCALE_LABELS, AdminLocale } from "@/i18n/admin";
import { Globe } from "lucide-react";

export function AdminLanguageSwitcher() {
  const { locale, setLocale } = useAdminI18n();

  return (
    <div className="flex items-center space-x-0.5 bg-white/[0.03] p-1 rounded-full border border-white/[0.08] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <Globe className="w-3.5 h-3.5 text-accent mx-1.5 shrink-0" />
      {ADMIN_LOCALES.map((loc) => {
        const isActive = locale === loc;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            className={`px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase rounded-full transition-all duration-200 ${
              isActive
                ? "bg-accent text-accent-foreground shadow-[0_0_14px_rgba(197,168,128,0.35)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
            }`}
            title={ADMIN_LOCALE_LABELS[loc].full}
          >
            {ADMIN_LOCALE_LABELS[loc].short}
          </button>
        );
      })}
    </div>
  );
}
