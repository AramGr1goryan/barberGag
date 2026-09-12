"use client";

import React from "react";
import Link from "next/link";
import { Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/timezone";
import { Clock, Scissors, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ServiceItem {
  id: string;
  nameHy: string;
  nameRu: string;
  nameEn: string;
  descriptionHy: string;
  descriptionRu: string;
  descriptionEn: string;
  durationMinutes: number;
  priceMinorUnits: number;
}

export interface ServicesSectionProps {
  locale: Locale;
  services: ServiceItem[];
  dict: {
    title: string;
    subtitle: string;
    duration: string;
  };
}

export function ServicesSection({ locale, services, dict }: ServicesSectionProps) {
  const getName = (s: ServiceItem) =>
    locale === "hy" ? s.nameHy : locale === "ru" ? s.nameRu : s.nameEn;

  const getDescription = (s: ServiceItem) =>
    locale === "hy" ? s.descriptionHy : locale === "ru" ? s.descriptionRu : s.descriptionEn;

  return (
    <section className="py-24 bg-surface border-y border-border/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 border-b border-accent/60 pb-1">
            <span className="text-[11px] font-mono tracking-[0.25em] text-accent uppercase font-semibold">
              Signature Menu
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground uppercase">
            {dict.title}
          </h2>
          <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
            {dict.subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-background/80 border border-border/80 p-8 flex flex-col justify-between hover:border-accent/60 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div className="w-8 h-8 rounded-none bg-surface-elevated border border-border flex items-center justify-center text-accent group-hover:border-accent transition-colors">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div className="flex items-center space-x-1.5 text-muted text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>
                      {service.durationMinutes} {dict.duration}
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                  {getName(service)}
                </h3>

                <p className="text-xs text-muted leading-relaxed font-light line-clamp-3">
                  {getDescription(service)}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between">
                <span className="font-mono text-base font-bold text-accent">
                  {formatCurrency(service.priceMinorUnits, locale)}
                </span>

                <Link href={`/${locale}/booking?serviceId=${service.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1.5 group-hover:text-accent">
                    <span>Գրանցվել</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* All Treatments CTA */}
        <div className="mt-16 text-center">
          <Link href={`/${locale}/booking`}>
            <Button size="lg" variant="primary">
              Դիտել բոլոր ծառայությունները և ամրագրել
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
