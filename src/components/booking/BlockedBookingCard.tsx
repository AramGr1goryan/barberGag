"use client";

import React, { useState, useEffect } from "react";
import { Locale } from "@/i18n/config";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, Clock, ArrowLeft, PhoneCall } from "lucide-react";
import Link from "next/link";

export interface BlockedBookingCardProps {
  locale: Locale;
  blockedUntil: string;
  initialSeconds?: number;
  cooldownHours: number;
}

export function BlockedBookingCard({
  locale,
  blockedUntil,
  initialSeconds = 10800,
  cooldownHours = 3,
}: BlockedBookingCardProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (blockedUntil) {
      const diff = Math.max(0, Math.floor((new Date(blockedUntil).getTime() - Date.now()) / 1000));
      return diff;
    }
    return initialSeconds;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  const unlockDate = blockedUntil ? new Date(blockedUntil) : new Date(Date.now() + secondsLeft * 1000);
  const formattedUnlockTime = unlockDate.toLocaleTimeString(locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const t = {
    hy: {
      badge: "Ժամանակավոր Սահմանափակում",
      title: "Գրանցումն արգելափակված է",
      desc: `Ամրագրումը չեղարկելուց հետո նոր գրանցումը ժամանակավորապես սահմանափակված է ${cooldownHours} ժամով:`,
      timerLabel: "Արգելափակումը կավարտվի՝",
      unlockAt: "Հասանելի կլինի ժամը՝",
      returnHome: "Վերադառնալ գլխավոր էջ",
      contactUs: "Հարցերի դեպքում կապվեք մեզ հետ",
    },
    ru: {
      badge: "Временное ограничение",
      title: "Доступ к регистрации заблокирован",
      desc: `После отмены бронирования доступ к новой записи временно заблокирован на ${cooldownHours} ч.`,
      timerLabel: "До разблокировки осталось:",
      unlockAt: "Доступ откроется в:",
      returnHome: "Вернуться на главную",
      contactUs: "Связаться с нами",
    },
    en: {
      badge: "Temporary Restriction",
      title: "Registration Temporarily Blocked",
      desc: `Following an appointment cancellation, new bookings are restricted for ${cooldownHours} hours.`,
      timerLabel: "Time until unlock:",
      unlockAt: "Access restores at:",
      returnHome: "Return to Homepage",
      contactUs: "Contact Support",
    },
  }[locale] || {
    badge: "Временное ограничение",
    title: "Доступ к регистрации заблокирован",
    desc: `После отмены бронирования доступ к новой записи заблокирован на ${cooldownHours} ч.`,
    timerLabel: "До разблокировки осталось:",
    unlockAt: "Доступ откроется в:",
    returnHome: "Вернуться на главную",
    contactUs: "Связаться с нами",
  };

  return (
    <div className="max-w-xl mx-auto bg-surface/85 backdrop-blur-2xl border border-red-500/20 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-8 sm:p-12 text-center space-y-8 animate-in fade-in duration-500">
      {/* Icon Badge */}
      <div className="space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(239,68,68,0.25)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full border border-red-500/30 bg-red-950/20 text-[11px] font-mono tracking-widest text-red-400 uppercase font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>{t.badge}</span>
        </div>
      </div>

      {/* Main Text */}
      <div className="space-y-3">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {t.title}
        </h2>
        <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-md mx-auto">
          {t.desc}
        </p>
      </div>

      {/* Countdown Display */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-3">
        <span className="text-[11px] font-mono tracking-wider text-muted uppercase block">
          {t.timerLabel}
        </span>
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 font-mono">
          <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 min-w-[56px]">
            <span className="text-2xl sm:text-3xl font-bold text-accent">{pad(hours)}</span>
            <span className="block text-[9px] text-muted uppercase mt-0.5">h</span>
          </div>
          <span className="text-xl font-bold text-muted">:</span>
          <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 min-w-[56px]">
            <span className="text-2xl sm:text-3xl font-bold text-accent">{pad(minutes)}</span>
            <span className="block text-[9px] text-muted uppercase mt-0.5">m</span>
          </div>
          <span className="text-xl font-bold text-muted">:</span>
          <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 min-w-[56px]">
            <span className="text-2xl sm:text-3xl font-bold text-accent">{pad(seconds)}</span>
            <span className="block text-[9px] text-muted uppercase mt-0.5">s</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center space-x-1.5 text-xs text-muted font-mono">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span>{t.unlockAt}</span>
          <span className="text-foreground font-semibold">{formattedUnlockTime}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <Link href={`/${locale}`} className="block">
          <Button variant="primary" size="lg" className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>{t.returnHome}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
