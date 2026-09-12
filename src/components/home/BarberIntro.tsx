"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Locale } from "@/i18n/config";
import { Award, Users, Clock, ArrowRight } from "lucide-react";

export interface BarberIntroProps {
  locale: Locale;
  dict: {
    badge: string;
    title: string;
    subtitle: string;
    story: string;
    experience: string;
    clients: string;
    awards: string;
    viewPortfolio: string;
  };
  barberName?: string;
}

export function BarberIntro({ locale, dict, barberName = "Գագիկ Ղամբարյան" }: BarberIntroProps) {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Portrait Column (Asymmetric with offset luxury frame) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            {/* Offset decorative border */}
            <div className="absolute -inset-3 sm:-inset-4 border border-accent/30 transform -rotate-1 z-0 pointer-events-none" />

            <div className="relative aspect-[3/4] w-full bg-surface border border-border overflow-hidden shadow-2xl z-10">
              <Image
                src="/images/gagik-barber.jpg"
                alt={barberName}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center filter contrast-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="text-[11px] font-mono tracking-[0.25em] text-accent uppercase font-semibold block">
                  Master Barber & Founder
                </span>
                <span className="font-display text-2xl font-bold text-foreground uppercase mt-1 block">
                  {barberName}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Story & Philosophy Column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center space-x-2 border-b border-accent/60 pb-1">
              <span className="text-[11px] font-mono tracking-[0.25em] text-accent uppercase font-semibold">
                {dict.badge}
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground uppercase leading-[1.2]">
              {dict.title}
            </h2>

            <p className="text-base sm:text-lg text-accent font-serif italic">
              «{dict.subtitle}»
            </p>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              {dict.story}
            </p>

            {/* Credential Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border/80">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-accent">
                  <Clock className="w-4 h-4" />
                  <span className="font-display text-xl font-bold text-foreground">12+</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{dict.experience}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-accent">
                  <Users className="w-4 h-4" />
                  <span className="font-display text-xl font-bold text-foreground">5,000+</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{dict.clients}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-accent">
                  <Award className="w-4 h-4" />
                  <span className="font-display text-xl font-bold text-foreground">Master</span>
                </div>
                <p className="text-xs text-muted-foreground font-medium">{dict.awards}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4 flex items-center space-x-4">
              <Link href={`/${locale}/about`}>
                <Button variant="outline" className="gap-2 group">
                  <span>{dict.viewPortfolio}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
