import React from "react";
import Link from "next/link";
import { Locale } from "@/i18n/config";
import { Scissors, MapPin, Phone, Mail, Clock } from "lucide-react";

export interface FooterProps {
  locale: Locale;
  dict: {
    footer: {
      description: string;
      quickLinks: string;
      contacts: string;
      rights: string;
    };
    nav: {
      booking: string;
      about: string;
      portfolio: string;
      contact: string;
    };
    contact: {
      addressVal: string;
      phoneVal: string;
      emailVal: string;
      hoursVal: string;
    };
  };
}

export function Footer({ locale, dict }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border/70 text-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2 pr-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 border border-accent/60 bg-surface-elevated flex items-center justify-center text-accent">
                <Scissors className="w-3.5 h-3.5 transform -rotate-45" />
              </div>
              <span className="font-display tracking-[0.2em] text-base font-bold text-foreground uppercase">
                GAGIK GHAMBARYAN
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              {dict.footer.description}
            </p>
            <div className="pt-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-accent">
                YEREVAN • ARMENIA • NORTHERN AVE 10
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-foreground font-semibold">
              {dict.footer.quickLinks}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href={`/${locale}/booking`} className="hover:text-accent transition-colors">
                  {dict.nav.booking}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="hover:text-accent transition-colors">
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/portfolio`} className="hover:text-accent transition-colors">
                  {dict.nav.portfolio}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-accent transition-colors">
                  {dict.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-foreground font-semibold">
              {dict.footer.contacts}
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>{dict.contact.addressVal}</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <a href={`tel:${dict.contact.phoneVal}`} className="hover:text-accent transition-colors">
                  {dict.contact.phoneVal}
                </a>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <a href={`mailto:${dict.contact.emailVal}`} className="hover:text-accent transition-colors">
                  {dict.contact.emailVal}
                </a>
              </li>
              <li className="flex items-start space-x-2.5">
                <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>{dict.contact.hoursVal}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted space-y-4 sm:space-y-0">
          <p>© {currentYear} Gagik Ghambaryan Barbershop. {dict.footer.rights}</p>
          <div className="flex space-x-6">
            <Link href="/admin/login" className="hover:text-accent font-mono tracking-widest uppercase text-[10px]">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
