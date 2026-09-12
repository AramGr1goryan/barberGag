"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Locale } from "@/i18n/config";
import { Home, Image as ImageIcon, Scissors, ShoppingBag, User } from "lucide-react";

export interface MobileBottomNavProps {
  locale: Locale;
  user?: { name: string; role: string } | null;
}

export function MobileBottomNav({ locale, user }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isHome = pathname === `/${locale}`;
  const isPortfolio = pathname === `/${locale}/portfolio`;
  const isBooking = pathname === `/${locale}/booking`;
  const isShop = pathname === `/${locale}/shop`;
  const isProfile = pathname.includes("/profile") || pathname.includes("/login") || pathname.includes("/admin");

  const profileHref = user
    ? user.role === "ADMIN"
      ? "/admin"
      : `/${locale}/profile`
    : `/${locale}/profile`;

  const labels = {
    home: locale === "ru" ? "Главная" : locale === "en" ? "Home" : "Գլխավոր",
    portfolio: locale === "ru" ? "Работы" : locale === "en" ? "Works" : "Պորտֆոլիո",
    booking: locale === "ru" ? "Запись" : locale === "en" ? "Book" : "Ամրագրել",
    shop: locale === "ru" ? "Шоп" : locale === "en" ? "Shop" : "Խանութ",
    profile: user
      ? locale === "ru"
        ? "Кабинет"
        : locale === "en"
        ? "Cabinet"
        : "Կաբինետ"
      : locale === "ru"
      ? "Вход"
      : locale === "en"
      ? "Login"
      : "Մուտք",
  };

  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <nav className="pointer-events-auto mx-auto max-w-md bg-[#13151f]/90 backdrop-blur-2xl border border-white/[0.12] rounded-full px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(197,168,128,0.08),inset_0_1px_0_rgba(255,255,255,0.08)] flex items-center justify-around">
        {/* 1. Home */}
        <Link
          href={`/${locale}`}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] rounded-full transition-all duration-200 ${
            isHome
              ? "text-accent scale-105 font-medium"
              : "text-zinc-400 hover:text-zinc-200 active:scale-95"
          }`}
          aria-label={labels.home}
        >
          <Home className={`w-5 h-5 ${isHome ? "text-accent drop-shadow-[0_0_8px_rgba(197,168,128,0.5)]" : ""}`} />
          <span className="text-[9px] font-mono tracking-tight mt-0.5">{labels.home}</span>
        </Link>

        {/* 2. Portfolio */}
        <Link
          href={`/${locale}/portfolio`}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] rounded-full transition-all duration-200 ${
            isPortfolio
              ? "text-accent scale-105 font-medium"
              : "text-zinc-400 hover:text-zinc-200 active:scale-95"
          }`}
          aria-label={labels.portfolio}
        >
          <ImageIcon className={`w-5 h-5 ${isPortfolio ? "text-accent drop-shadow-[0_0_8px_rgba(197,168,128,0.5)]" : ""}`} />
          <span className="text-[9px] font-mono tracking-tight mt-0.5">{labels.portfolio}</span>
        </Link>

        {/* 3. Center Elevated Quick-Book Action (The Thumb Prime Spot) */}
        <Link
          href={`/${locale}/booking`}
          className="relative -top-4 flex flex-col items-center justify-center group focus:outline-none"
          aria-label={labels.booking}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.5),0_0_25px_rgba(197,168,128,0.4)] ${
              isBooking
                ? "bg-gradient-to-tr from-[#c5a880] to-[#dfc7a5] text-black ring-4 ring-black/80 scale-110"
                : "bg-gradient-to-tr from-[#b8996e] to-[#d4b993] text-black hover:scale-105 active:scale-95 ring-4 ring-[#13151f]"
            }`}
          >
            <Scissors className="w-6 h-6 transform -rotate-45" />
          </div>
          <span className="text-[9px] font-mono tracking-wider font-bold text-accent mt-0.5 uppercase drop-shadow">
            {labels.booking}
          </span>
        </Link>

        {/* 4. Shop */}
        <Link
          href={`/${locale}/shop`}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] rounded-full transition-all duration-200 ${
            isShop
              ? "text-accent scale-105 font-medium"
              : "text-zinc-400 hover:text-zinc-200 active:scale-95"
          }`}
          aria-label={labels.shop}
        >
          <ShoppingBag className={`w-5 h-5 ${isShop ? "text-accent drop-shadow-[0_0_8px_rgba(197,168,128,0.5)]" : ""}`} />
          <span className="text-[9px] font-mono tracking-tight mt-0.5">{labels.shop}</span>
        </Link>

        {/* 5. Profile / Cabinet */}
        <Link
          href={profileHref}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] rounded-full transition-all duration-200 ${
            isProfile
              ? "text-accent scale-105 font-medium"
              : "text-zinc-400 hover:text-zinc-200 active:scale-95"
          }`}
          aria-label={labels.profile}
        >
          <User className={`w-5 h-5 ${isProfile ? "text-accent drop-shadow-[0_0_8px_rgba(197,168,128,0.5)]" : ""}`} />
          <span className="text-[9px] font-mono tracking-tight mt-0.5">{labels.profile}</span>
        </Link>
      </nav>
    </div>
  );
}
