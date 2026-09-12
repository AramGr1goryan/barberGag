"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOCALES, Locale, LOCALE_LABELS } from "@/i18n/config";
import { Globe, ChevronDown } from "lucide-react";

const LOCALE_FLAGS: Record<Locale, string> = {
  hy: "🇦🇲",
  ru: "🇷🇺",
  en: "🇬🇧",
};

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = (targetLocale: Locale) => {
    if (targetLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Persist locale cookie
    document.cookie = `barber_locale=${targetLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Replace current locale prefix in path
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && LOCALES.includes(segments[0] as Locale)) {
      segments[0] = targetLocale;
    } else {
      segments.unshift(targetLocale);
    }

    const newPath = `/${segments.join("/")}`;
    setIsOpen(false);
    router.push(newPath);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl text-[11px] font-mono tracking-wider text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all duration-200 shadow-[0_2px_15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
        aria-label="Switch language"
      >
        <Globe className="w-3.5 h-3.5 text-accent" />
        <span className="font-semibold">{LOCALE_LABELS[currentLocale]}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 min-w-[130px] rounded-xl bg-surface/95 border border-white/[0.08] shadow-[0_10px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl z-50 overflow-hidden py-1">
          {LOCALES.map((loc) => {
            const isActive = loc === currentLocale;
            return (
              <button
                key={loc}
                onClick={() => handleSwitch(loc)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-[11px] font-mono tracking-wider transition-all duration-150 ${
                  isActive
                    ? "bg-accent/15 text-accent font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                }`}
              >
                <span className="text-sm">{LOCALE_FLAGS[loc]}</span>
                <span>{LOCALE_LABELS[loc]}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
