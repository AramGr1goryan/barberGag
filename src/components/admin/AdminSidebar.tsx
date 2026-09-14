"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { AdminLanguageSwitcher } from "./AdminLanguageSwitcher";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  Clock,
  Scissors,
  Image as ImageIcon,
  Palette,
  FileText,
  PhoneCall,
  Shield,
  TrendingUp,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AdminSidebar() {
  const pathname = usePathname();
  const { t, locale } = useAdminI18n();

  const navLinks = [
    { href: "/admin", label: t.nav.overview, icon: LayoutDashboard },
    { href: "/admin/analytics", label: t.nav.analytics, icon: TrendingUp, highlight: true },
    { href: "/admin/barber-calendar", label: t.nav.barberCalendar, icon: CalendarCheck2 },
    { href: "/admin/calendar", label: t.nav.calendar, icon: CalendarDays },
    { href: "/admin/bookings", label: t.nav.bookings, icon: Clock },
    { href: "/admin/services", label: t.nav.services, icon: Scissors },
    { href: "/admin/portfolio", label: t.nav.portfolio, icon: ImageIcon },
    { href: "/admin/content", label: t.nav.content, icon: FileText },
    { href: "/admin/appearance", label: t.nav.appearance, icon: Palette },
    { href: "/admin/callbacks", label: t.nav.callbacks, icon: PhoneCall },
    { href: "/admin/audit", label: t.nav.audit, icon: Shield },
  ];

  return (
    <aside className="w-64 bg-[#181a24]/90 backdrop-blur-2xl border-r border-white/[0.08] hidden md:flex flex-col justify-between shrink-0 shadow-[4px_0_30px_rgba(0,0,0,0.3)] z-20">
      <div>
        {/* Logo Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl border border-accent/40 bg-accent/10 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(197,168,128,0.18)] shrink-0">
            <Scissors className="w-4 h-4 transform -rotate-45" />
          </div>
          <div>
            <span className="font-display tracking-widest text-sm font-bold text-foreground block uppercase">
              {t.nav.adminConsole}
            </span>
            <span className="text-[9px] font-mono tracking-widest text-accent/90 uppercase">
              Gagik Ghambaryan
            </span>
          </div>
        </div>

        {/* Language Switcher Bar */}
        <div className="mx-3 mt-3 px-3.5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <span className="text-[10px] font-mono tracking-wider text-muted uppercase">
            Language:
          </span>
          <AdminLanguageSwitcher />
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`flex items-center space-x-3 px-3.5 py-2.5 text-xs font-medium tracking-wider uppercase transition-all duration-200 rounded-2xl ${
                  isActive
                    ? "text-accent bg-accent/15 border border-accent/30 shadow-[0_0_25px_rgba(197,168,128,0.18)] font-semibold"
                    : link.highlight
                    ? "text-accent bg-accent/5 hover:bg-accent/10 border border-accent/20 hover:translate-x-1"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06] hover:translate-x-1"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/[0.06] space-y-1.5">
        <Link
          href={`/${locale}`}
          target="_blank"
          className="flex items-center justify-between w-full px-3.5 py-2 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-2xl border border-transparent hover:border-white/[0.06] transition-all duration-200"
        >
          <span>{t.nav.visitWebsite}</span>
          <ExternalLink className="w-3.5 h-3.5 text-accent" />
        </Link>

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex items-center space-x-3 w-full px-3.5 py-2 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl border border-transparent hover:border-rose-500/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.nav.logout}</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

export function AdminMobileHeader() {
  const { t } = useAdminI18n();

  return (
    <header className="md:hidden bg-[#181a24]/90 backdrop-blur-2xl border-b border-white/[0.08] p-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-2.5">
        <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
          <Scissors className="w-4 h-4" />
        </div>
        <span className="font-display font-bold text-sm tracking-wider uppercase">
          {t.nav.adminConsole}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <AdminLanguageSwitcher />
        <Link href="/admin/barber-calendar">
          <Button size="sm" variant="primary">
            {t.nav.barberCalendar}
          </Button>
        </Link>
      </div>
    </header>
  );
}
