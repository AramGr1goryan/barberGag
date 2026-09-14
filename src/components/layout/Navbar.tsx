"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Locale } from "@/i18n/config";
import { Button } from "@/components/ui/Button";
import { Menu, X, Scissors, User as UserIcon, UserPlus, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface NavbarProps {
  locale: Locale;
  dict: {
    booking: string;
    about: string;
    portfolio: string;
    contact: string;
    login: string;
    signup: string;
    profile: string;
    admin: string;
    logout: string;
  };
  user?: { name: string; role: string } | null;
}

export function Navbar({ locale, dict, user }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isBooking = pathname?.includes("/booking");

  const navLinks = [
    { href: `/${locale}/booking`, label: dict.booking },
    { href: `/${locale}/about`, label: dict.about },
    { href: `/${locale}/portfolio`, label: dict.portfolio },
    { href: `/${locale}/contact`, label: dict.contact },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border/80 py-3.5 shadow-2xl"
          : "bg-gradient-to-b from-background/90 via-background/40 to-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center space-x-2.5 group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-none border border-accent/60 bg-surface flex items-center justify-center text-accent group-hover:border-accent transition-colors">
            <Scissors className="w-4 h-4 transform -rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="font-display tracking-[0.2em] text-sm sm:text-base font-bold text-foreground group-hover:text-accent transition-colors uppercase">
              GAGIK GHAMBARYAN
            </span>
            <span className="text-[9px] tracking-[0.3em] text-muted-foreground uppercase font-mono">
              Bespoke Barber
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-widest transition-colors font-medium ${
                  isActive ? "text-accent border-b border-accent pb-1" : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / Language / User */}
        <div className="hidden md:flex items-center space-x-5">
          <div className="flex items-center space-x-2">
            <LanguageSwitcher currentLocale={locale} />
            <Link
              href={`/${locale}/shop`}
              className="p-2 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl text-muted-foreground hover:text-accent hover:border-accent/30 transition-all duration-200 shadow-[0_2px_15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
              aria-label="Shop"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </Link>
          </div>

          {user ? (
            <Link
              href={user.role === "ADMIN" ? "/admin" : `/${locale}/profile`}
              className="flex items-center space-x-2 text-xs uppercase tracking-wider text-muted hover:text-accent transition-colors"
            >
              <UserIcon className="w-4 h-4 text-accent" />
              <span className="max-w-[120px] truncate">{user.name}</span>
            </Link>
          ) : (
            <>
              <Link
                href={`/${locale}/login`}
                className="text-xs uppercase tracking-widest text-muted hover:text-foreground transition-colors"
              >
                {dict.login}
              </Link>
              <Link href={`/${locale}/signup`}>
                <Button size="sm" variant="outline" className="gap-1.5 border-accent/50 text-accent hover:bg-accent/10">
                  <UserPlus className="w-3.5 h-3.5" />
                  {dict.signup}
                </Button>
              </Link>
            </>
          )}

          <Link href={`/${locale}/booking`}>
            <Button size="sm" variant="primary">
              {dict.booking}
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center space-x-2">
          <LanguageSwitcher currentLocale={locale} />
          <Link
            href={`/${locale}/shop`}
            className="p-2 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl text-muted-foreground hover:text-accent hover:border-accent/30 transition-all duration-200 shadow-[0_2px_15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
            aria-label="Shop"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-foreground hover:text-accent transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Out Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-surface border-b border-border/80 px-6 py-8 space-y-6"
          >
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm uppercase tracking-widest text-foreground hover:text-accent font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4 border-t border-border flex flex-col space-y-3">
                {user ? (
                  <Link
                    href={user.role === "ADMIN" ? "/admin" : `/${locale}/profile`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-sm text-accent uppercase tracking-wider"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>{user.name} ({dict.profile})</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href={`/${locale}/login`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm uppercase tracking-widest text-muted hover:text-foreground"
                    >
                      {dict.login}
                    </Link>
                    <Link
                      href={`/${locale}/signup`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full py-2.5 gap-2 border-accent/50 text-accent hover:bg-accent/10">
                        <UserPlus className="w-4 h-4" />
                        {dict.signup}
                      </Button>
                    </Link>
                  </>
                )}

                <Link href={`/${locale}/booking`} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full py-3" variant="primary">
                    {dict.booking}
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
