"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { AdminLanguageSwitcher } from "./AdminLanguageSwitcher";
import {
  Scissors,
  ExternalLink,
  Menu,
  X,
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  Clock,
  Image as ImageIcon,
  Palette,
  FileText,
  PhoneCall,
  Shield,
  TrendingUp,
  LogOut,
  Sparkles,
} from "lucide-react";

export function AdminTopHeader() {
  const pathname = usePathname();
  const { t, locale } = useAdminI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Derive current title
  const currentLink = navLinks.find((l) => l.href === pathname);
  const currentTitle = currentLink ? currentLink.label : t.nav.adminConsole;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#181a24]/85 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.25)]">
        {/* Left: Mobile menu toggle + Title / Master branding */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-xl border border-white/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl border border-accent/40 bg-accent/10 flex items-center justify-center text-accent shadow-[0_0_18px_rgba(197,168,128,0.18)] shrink-0">
              <Scissors className="w-4 h-4 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-sm sm:text-base tracking-wider uppercase text-foreground">
                  {currentTitle}
                </span>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[9px] font-mono tracking-widest uppercase bg-accent/10 text-accent border border-accent/25 rounded-full shadow-[0_0_12px_rgba(197,168,128,0.12)]">
                  <Sparkles className="w-2.5 h-2.5 mr-1" /> Gagik Ghambaryan
                </span>
              </div>
              <p className="hidden md:block text-[10px] font-mono text-muted tracking-wider">
                Yerevan, Armenia • Sayat-Nova Ave
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick actions + Language Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link
            href={`/${locale}`}
            target="_blank"
            className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-mono text-zinc-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] rounded-full border border-white/[0.08] hover:border-white/[0.15] shadow-sm transition-all duration-200"
          >
            <span>{t.nav.visitWebsite}</span>
            <ExternalLink className="w-3.5 h-3.5 text-accent" />
          </Link>

          {/* Prominent Language Switcher */}
          <div className="flex items-center">
            <AdminLanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex">
          <div className="w-72 max-w-[85vw] bg-[#181a24]/98 backdrop-blur-2xl border-r border-white/10 rounded-r-3xl p-6 flex flex-col justify-between shadow-2xl h-full animate-in slide-in-from-left duration-200">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-sm uppercase tracking-wider text-foreground">
                    {t.nav.adminConsole}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-xl border border-white/10 hover:bg-white/[0.06]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Language Switcher in Mobile Drawer */}
              <div className="py-4 border-b border-white/10 flex flex-col space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
                  Language:
                </span>
                <AdminLanguageSwitcher />
              </div>

              {/* Navigation Links */}
              <nav className="py-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)]">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3.5 py-2.5 text-xs font-medium tracking-wider uppercase transition-all duration-200 rounded-2xl ${
                        isActive
                          ? "text-accent bg-accent/15 border border-accent/30 shadow-[0_0_20px_rgba(197,168,128,0.15)] font-semibold"
                          : link.highlight
                          ? "text-accent bg-accent/5 hover:bg-accent/10 border border-accent/20"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <Link
                href={`/${locale}`}
                target="_blank"
                className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/[0.04] rounded-2xl border border-white/[0.06] transition-colors"
              >
                <span>{t.nav.visitWebsite}</span>
                <ExternalLink className="w-3.5 h-3.5 text-accent" />
              </Link>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="flex items-center space-x-3 w-full px-4 py-2.5 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl border border-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t.nav.logout}</span>
                </button>
              </form>
            </div>
          </div>

          <div
            className="flex-1"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}
    </>
  );
}
