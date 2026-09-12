"use client";

import React, { useState, useEffect } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Palette,
  Sparkles,
  Type,
  Globe,
  Check,
  ExternalLink,
  Code2,
} from "lucide-react";

interface FontOption {
  name: string;
  label: string;
  category: string;
  previewText: {
    hy: string;
    ru: string;
    en: string;
  };
}

const FONT_OPTIONS: FontOption[] = [
  {
    name: "Noto Sans Armenian",
    label: "Noto Sans Armenian",
    category: "Modern Armenian & Universal Sans",
    previewText: {
      hy: "Պրեմիում բարբերշոփ և դասական ոճ",
      ru: "Премиальный барбершоп и классический стиль",
      en: "Premium Barber Experience & Timeless Style",
    },
  },
  {
    name: "Cinzel",
    label: "Cinzel",
    category: "Classical Roman Serif (Luxury & Heritage)",
    previewText: {
      hy: "ՀԱՅԿԱԿԱՆ ԴԱՍԱԿԱՆ ՈՃ ԵՎ ՇՔԵՂՈՒԹՅՈՒՆ",
      ru: "ИМПЕРСКАЯ РОСКОШЬ И МАСТЕРСТВО",
      en: "IMPERIAL CRAFTSMANSHIP & PRECISION",
    },
  },
  {
    name: "Cormorant Garamond",
    label: "Cormorant Garamond",
    category: "Artisanal Haute-Editorial Serif",
    previewText: {
      hy: "Բարձրակարգ սպասարկում և ոճային սանրվածքներ",
      ru: "Высокое искусство стрижки и заботы",
      en: "Haute Artisanal Grooming & Excellence",
    },
  },
  {
    name: "Montserrat",
    label: "Montserrat",
    category: "High-Contrast Architectural Sans",
    previewText: {
      hy: "Ժամանակակից քաղաքային գեղագիտություն",
      ru: "Современная городская эстетика и форма",
      en: "Modern Urban Precision & Geometry",
    },
  },
  {
    name: "Outfit",
    label: "Outfit",
    category: "Neo-Grotesque Display Sans",
    previewText: {
      hy: "Առաջադեմ և մաքուր մինիմալիզմ",
      ru: "Прогрессивный чистый минимализм",
      en: "Forward Minimalist Aesthetics & Clarity",
    },
  },
  {
    name: "Playfair Display",
    label: "Playfair Display",
    category: "Distinguished Editorial Serif",
    previewText: {
      hy: "Նրբագեղություն, որն ընդգծում է բնավորությունը",
      ru: "Элегантность, подчеркивающая статус",
      en: "Elegance That Defines Character",
    },
  },
  {
    name: "Plus Jakarta Sans",
    label: "Plus Jakarta Sans",
    category: "Tech Precision & Contemporary Flow",
    previewText: {
      hy: "Անթերի ճշգրտություն յուրաքանչյուր մանրուքում",
      ru: "Безупречная точность в каждой детали",
      en: "Flawless Precision In Every Detail",
    },
  },
  {
    name: "Syne",
    label: "Syne",
    category: "Avant-Garde Expressive Geometry",
    previewText: {
      hy: "ԱՎԱՆԳԱՐԴ ԵՎ ԻՆՔՆԱՏԻՊ ՈՃ",
      ru: "АВАНГАРД И СМЕЛЫЙ СТИЛЬ",
      en: "AVANT-GARDE & BOLD PRESENCE",
    },
  },
  {
    name: "Inter",
    label: "Inter",
    category: "Balanced Functional Modern Sans",
    previewText: {
      hy: "Հստակ ընթեռնելիություն և հարմարավետություն",
      ru: "Превосходная читаемость и комфорт",
      en: "Optimized Readability & Clean Hierarchy",
    },
  },
];

export function ThemeManager() {
  const { t } = useAdminI18n();
  const [background, setBackground] = useState("#0d0d0f");
  const [surface, setSurface] = useState("#16161a");
  const [surfaceElevated, setSurfaceElevated] = useState("#1f1f24");
  const [border, setBorder] = useState("#2a2a32");
  const [muted, setMuted] = useState("#8e8e9c");
  const [accent, setAccent] = useState("#c5a880");
  const [accentForeground, setAccentForeground] = useState("#000000");
  const [buttonStyle, setButtonStyle] = useState<"sharp" | "subtle" | "pill">("pill");
  const [hoverEffect, setHoverEffect] = useState<"glow" | "lift" | "shimmer">("glow");

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");

  // Multi-Language Font Configuration
  const [fontHy, setFontHy] = useState("Noto Sans Armenian");
  const [fontRu, setFontRu] = useState("Montserrat");
  const [fontEn, setFontEn] = useState("Cinzel");
  const [customFontName, setCustomFontName] = useState("");
  const [customFontUrl, setCustomFontUrl] = useState("");
  const [activeFontLang, setActiveFontLang] = useState<"hy" | "ru" | "en">("hy");
  const [isFontLoading, setIsFontLoading] = useState(false);
  const [fontSuccess, setFontSuccess] = useState("");
  const [fontError, setFontError] = useState("");

  useEffect(() => {
    const fetchThemeAndFonts = async () => {
      try {
        const [themeRes, fontsRes] = await Promise.all([
          fetch("/api/admin/theme"),
          fetch("/api/admin/theme/fonts"),
        ]);
        const data = await themeRes.json();
        if (data.theme) {
          setBackground(data.theme.background);
          setSurface(data.theme.surface);
          setSurfaceElevated(data.theme.surfaceElevated);
          setBorder(data.theme.border);
          setMuted(data.theme.muted);
          setAccent(data.theme.accent);
          setAccentForeground(data.theme.accentForeground);
          setButtonStyle(data.theme.buttonStyle || "pill");
          setHoverEffect(data.theme.hoverEffect || "glow");
        }

        if (fontsRes.ok) {
          const fontsData = await fontsRes.json();
          if (fontsData.fonts) {
            setFontHy(fontsData.fonts.fontHy || "Noto Sans Armenian");
            setFontRu(fontsData.fonts.fontRu || "Montserrat");
            setFontEn(fontsData.fonts.fontEn || "Cinzel");
            setCustomFontName(fontsData.fonts.customFontName || "");
            setCustomFontUrl(fontsData.fonts.customFontUrl || "");
          }
        }
      } catch {
        // ignore
      }
    };
    fetchThemeAndFonts();
  }, []);

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          background,
          foreground: "#f4f4f6",
          surface,
          surfaceElevated,
          border,
          muted,
          accent,
          accentForeground,
          buttonStyle,
          hoverEffect,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update theme");
      }

      setNotification(t.appearance.themeSavedSuccess);
      setTimeout(() => setNotification(""), 3500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFonts = async () => {
    setIsFontLoading(true);
    setFontError("");
    setFontSuccess("");

    try {
      const res = await fetch("/api/admin/theme/fonts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fontHy,
          fontRu,
          fontEn,
          customFontName,
          customFontUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save font settings");
      }

      setFontSuccess(t.appearance.fontsSavedSuccess);
      setTimeout(() => setFontSuccess(""), 3500);
    } catch (err: unknown) {
      setFontError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setIsFontLoading(false);
    }
  };

  const getActiveFontForLang = (lang: "hy" | "ru" | "en") => {
    if (lang === "hy") return fontHy;
    if (lang === "ru") return fontRu;
    return fontEn;
  };

  const setActiveFontForLang = (lang: "hy" | "ru" | "en", fontName: string) => {
    if (lang === "hy") setFontHy(fontName);
    else if (lang === "ru") setFontRu(fontName);
    else setFontEn(fontName);
  };

  const currentActiveFont = getActiveFontForLang(activeFontLang);

  return (
    <div className="space-y-12 max-w-5xl">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#c5a880]" />
          <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-semibold">
            {t.dashboard.executiveOverview}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-tight">
          {t.appearance.title}
        </h1>
        <p className="text-xs text-muted font-mono mt-1">
          {t.appearance.subtitle}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* TYPOGRAPHY & MULTI-LANGUAGE FONT SELECTION STUDIO                         */}
      {/* ========================================================================= */}
      <div className="bg-[#181b26]/85 backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-6 sm:p-8 space-y-8 shadow-[0_12px_40px_rgba(0,0,0,0.35)] relative overflow-hidden">
        {/* Soft luminous liquid glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(197,168,128,0.2)]">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-foreground uppercase tracking-wide">
                {t.appearance.fontsTitle}
              </h2>
              <p className="text-xs text-muted font-mono mt-0.5">
                {t.appearance.fontsSubtitle}
              </p>
            </div>
          </div>

          {/* Language Selector Tabs */}
          <div className="inline-flex p-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-xl shrink-0">
            {(
              [
                { code: "hy", label: "Հայերեն (HY)" },
                { code: "ru", label: "Русский (RU)" },
                { code: "en", label: "English (EN)" },
              ] as const
            ).map((item) => {
              const isActive = activeFontLang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setActiveFontLang(item.code)}
                  className={`px-4 py-2 rounded-full text-xs font-mono font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-accent text-accent-foreground shadow-[0_2px_15px_rgba(197,168,128,0.4)]"
                      : "text-muted hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        {fontSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs font-mono text-emerald-300 flex items-center space-x-2.5 shadow-[0_4px_20px_rgba(16,185,129,0.12)] backdrop-blur-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{fontSuccess}</span>
          </div>
        )}

        {fontError && (
          <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-xs font-mono text-red-300 shadow-[0_4px_20px_rgba(239,68,68,0.12)] backdrop-blur-xl">
            {fontError}
          </div>
        )}

        {/* Active Font Status Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <Globe className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono text-muted uppercase">
              {activeFontLang === "hy"
                ? t.appearance.fontHy
                : activeFontLang === "ru"
                ? t.appearance.fontRu
                : t.appearance.fontEn}
              :
            </span>
            <span className="text-sm font-bold text-accent font-mono px-2.5 py-1 rounded-full bg-accent/15 border border-accent/30">
              {currentActiveFont}
            </span>
          </div>
          <span className="text-[11px] font-mono text-white/40">
            {t.appearance.livePreview}
          </span>
        </div>

        {/* Font Selection Grid */}
        <div className="space-y-4">
          <label className="block text-xs font-mono text-muted uppercase tracking-wider">
            {t.appearance.presetPalettes} ({FONT_OPTIONS.length})
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {FONT_OPTIONS.map((font) => {
              const isSelected = currentActiveFont === font.name;
              return (
                <div
                  key={font.name}
                  onClick={() => setActiveFontForLang(activeFontLang, font.name)}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? "bg-accent/15 border-accent shadow-[0_4px_25px_rgba(197,168,128,0.22)] ring-1 ring-accent/50"
                      : "bg-[#12141c]/70 border-white/[0.08] hover:border-white/20 hover:bg-[#181b26]/90 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        {font.label}
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-muted uppercase tracking-tight">
                        {font.category}
                      </div>
                    </div>
                  </div>

                  {/* Sample text rendered in this font */}
                  <div
                    className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-white/90 truncate"
                    style={{ fontFamily: `'${font.name}', sans-serif` }}
                  >
                    {font.previewText[activeFontLang]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Font Integration Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#141721]/80 border border-white/[0.08] space-y-4 backdrop-blur-xl">
          <div className="flex items-center space-x-2.5">
            <Code2 className="w-4 h-4 text-accent" />
            <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wide">
              {t.appearance.customFont} (Google Fonts)
            </h3>
          </div>
          <p className="text-xs text-muted font-mono leading-relaxed">
            Подключите любой понравившийся шрифт из библиотеки Google Fonts. Укажите название семейства и ссылку на стили CSS:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-muted uppercase">
                {t.appearance.customFontName}
              </label>
              <input
                type="text"
                placeholder="e.g. Marcellus or Caveat"
                value={customFontName}
                onChange={(e) => setCustomFontName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-muted uppercase">
                {t.appearance.customFontUrl}
              </label>
              <input
                type="url"
                placeholder="https://fonts.googleapis.com/css2?family=Marcellus&display=swap"
                value={customFontUrl}
                onChange={(e) => setCustomFontUrl(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent transition-all"
              />
            </div>
          </div>

          {customFontName && (
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setActiveFontForLang(activeFontLang, customFontName)}
                className={`px-4 py-2 rounded-full text-xs font-mono font-semibold border transition-all ${
                  currentActiveFont === customFontName
                    ? "bg-accent text-accent-foreground border-accent shadow-[0_2px_15px_rgba(197,168,128,0.3)]"
                    : "bg-white/5 border-white/10 text-white hover:border-accent"
                }`}
              >
                Использовать {customFontName} для {activeFontLang.toUpperCase()}
              </button>
            </div>
          )}
        </div>

        {/* Live Typography Preview Bento Box */}
        <div className="p-6 rounded-3xl bg-black/40 border border-white/10 space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              {t.appearance.livePreview} — {currentActiveFont} ({activeFontLang.toUpperCase()})
            </span>
          </div>

          <div
            className="space-y-3 p-6 rounded-2xl bg-[#0f1118]/80 border border-white/5 transition-all"
            style={{ fontFamily: `'${currentActiveFont}', sans-serif` }}
          >
            <div className="text-2xl sm:text-3xl font-bold text-accent tracking-wide uppercase">
              {activeFontLang === "hy"
                ? "Արվեստ, ճշգրտություն և անհատական ոճ"
                : activeFontLang === "ru"
                ? "Искусство, точность и персональный стиль"
                : "Artistry, Precision & Signature Grooming"}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {activeFontLang === "hy"
                ? "Բարձրակարգ սպասարկում, որտեղ յուրաքանչյուր մանրուք ստեղծված է ձեր անհատականությունը շեշտելու համար: Ժամանակակից սարքավորումներ և պրոֆեսիոնալ մոտեցում:"
                : activeFontLang === "ru"
                ? "Премиальное пространство для мужчин, ценящих безупречный сервис, внимание к деталям и атмосферу закрытого джентльменского клуба."
                : "An elite grooming sanctuary crafted for gentlemen who demand flawless execution, bespoke care, and an uncompromising standard of luxury."}
            </p>
          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveFonts}
            disabled={isFontLoading}
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-accent text-accent-foreground shadow-[0_4px_25px_rgba(197,168,128,0.3)] hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isFontLoading ? (
              <span>{t.common.loading}</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{t.appearance.saveFonts}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THEME PALETTE & BUTTON SILHOUETTE ENGINE                                  */}
      {/* ========================================================================= */}
      {notification && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs font-mono text-emerald-300 flex items-center space-x-2.5 shadow-[0_4px_20px_rgba(16,185,129,0.12)] backdrop-blur-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-xs font-mono text-red-300 shadow-[0_4px_20px_rgba(239,68,68,0.12)] backdrop-blur-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveTheme} className="space-y-8">
        {/* Colors Bento Card */}
        <div className="bg-[#181b26]/85 backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-center space-x-2.5 border-b border-white/[0.08] pb-4">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Palette className="w-4 h-4" />
            </div>
            <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide">
              {t.appearance.brandColors}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-muted uppercase">
                {t.appearance.primaryGold}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-11 h-11 rounded-2xl bg-black/40 border border-white/15 cursor-pointer p-1 hover:border-accent transition-all"
                />
                <input
                  type="text"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-foreground uppercase focus:outline-none focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-muted uppercase">
                {t.appearance.backgroundDark}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-11 h-11 rounded-2xl bg-black/40 border border-white/15 cursor-pointer p-1 hover:border-accent transition-all"
                />
                <input
                  type="text"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-foreground uppercase focus:outline-none focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-muted uppercase">
                {t.appearance.surfaceDark}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  className="w-11 h-11 rounded-2xl bg-black/40 border border-white/15 cursor-pointer p-1 hover:border-accent transition-all"
                />
                <input
                  type="text"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-foreground uppercase focus:outline-none focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-muted uppercase">
                {t.appearance.accentLight}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={surfaceElevated}
                  onChange={(e) => setSurfaceElevated(e.target.value)}
                  className="w-11 h-11 rounded-2xl bg-black/40 border border-white/15 cursor-pointer p-1 hover:border-accent transition-all"
                />
                <input
                  type="text"
                  value={surfaceElevated}
                  onChange={(e) => setSurfaceElevated(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-foreground uppercase focus:outline-none focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-muted uppercase">
                {t.appearance.backgroundDark} (Border)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={border}
                  onChange={(e) => setBorder(e.target.value)}
                  className="w-11 h-11 rounded-2xl bg-black/40 border border-white/15 cursor-pointer p-1 hover:border-accent transition-all"
                />
                <input
                  type="text"
                  value={border}
                  onChange={(e) => setBorder(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-foreground uppercase focus:outline-none focus:border-accent transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-muted uppercase">
                {t.appearance.surfaceDark} (Muted)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={muted}
                  onChange={(e) => setMuted(e.target.value)}
                  className="w-11 h-11 rounded-2xl bg-black/40 border border-white/15 cursor-pointer p-1 hover:border-accent transition-all"
                />
                <input
                  type="text"
                  value={muted}
                  onChange={(e) => setMuted(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-foreground uppercase focus:outline-none focus:border-accent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Button & Silhouette Bento Card */}
        <div className="bg-[#181b26]/85 backdrop-blur-2xl border border-white/[0.1] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-center space-x-2.5 border-b border-white/[0.08] pb-4">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide">
              {t.appearance.buttonSilhouette}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono text-muted mb-3 uppercase">
                {t.appearance.buttonSilhouette}
              </label>
              <div className="space-y-2.5 text-xs font-mono">
                {[
                  { key: "sharp", label: t.appearance.square },
                  { key: "subtle", label: t.appearance.roundedSmall },
                  { key: "pill", label: t.appearance.roundedFull },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className={`flex items-center space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      buttonStyle === opt.key
                        ? "bg-accent/15 border-accent text-foreground shadow-[0_0_20px_rgba(197,168,128,0.2)]"
                        : "bg-black/30 border-white/5 text-muted hover:border-white/15"
                    }`}
                  >
                    <input
                      type="radio"
                      name="buttonStyle"
                      value={opt.key}
                      checked={buttonStyle === opt.key}
                      onChange={() => setButtonStyle(opt.key as "sharp" | "subtle" | "pill")}
                      className="text-accent focus:ring-accent accent-accent"
                    />
                    <span className="font-semibold">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-muted mb-3 uppercase">
                {t.appearance.livePreview}
              </label>
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                <Button
                  variant="primary"
                  size="md"
                  className={`${
                    buttonStyle === "pill"
                      ? "rounded-full"
                      : buttonStyle === "subtle"
                      ? "rounded-2xl"
                      : "rounded-lg"
                  } shadow-[0_4px_20px_rgba(197,168,128,0.3)]`}
                >
                  {t.nav.bookings}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider bg-accent text-accent-foreground shadow-[0_4px_20px_rgba(197,168,128,0.25)] hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isLoading ? t.common.loading : t.appearance.saveTheme}
        </button>
      </form>
    </div>
  );
}
