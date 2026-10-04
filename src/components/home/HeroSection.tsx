"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BookingWizard, ServiceItem, AddonItem } from "@/components/booking/BookingWizard";
import { Locale } from "@/i18n/config";
import { Calendar, PhoneCall, ArrowRight } from "lucide-react";

import { useSearchParams } from "next/navigation";

export interface HeroSectionProps {
  locale: Locale;
  barberPhotoUrl?: string;
  dict: {
    badge: string;
    title: string;
    subtitle: string;
    bookNow: string;
    requestCallback: string;
  };
  services?: ServiceItem[];
  addons?: AddonItem[];
  bookingDict?: any;
  currentUser?: { name: string; phone: string } | null;
  initialServiceId?: string;
}

export function HeroSection({
  locale,
  barberPhotoUrl = "/images/gagik-barber.jpg",
  dict,
  services,
  addons,
  bookingDict,
  currentUser,
  initialServiceId,
}: HeroSectionProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("book") === "true") {
      setIsBookingOpen(true);
    }
  }, [searchParams]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax on scroll
  const imageScrollY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const contentScrollY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative h-[100dvh] flex items-center justify-center overflow-hidden -mt-20 pt-20 perspective-[1000px]"
    >
      {/* 
        CINEMATIC BARBER PORTRAIT
        Initial state: Large, prominent, closer to viewer.
        On entrance: Smoothly zooms back (recedes into the background) and establishes depth.
      */}
      <motion.div
        style={{ y: imageScrollY }}
        initial={{
          scale: 1.18,
          filter: "brightness(0.75) contrast(1.15)",
        }}
        animate={{
          scale: 1.0,
          filter: "brightness(0.42) contrast(1.08)",
        }}
        transition={{
          duration: 1.8,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="absolute inset-0 w-full h-[120%] -top-[10%] z-0"
      >
        <Image
          src={barberPhotoUrl}
          alt="Master Barber Gagik Ghambaryan"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top sm:object-center filter"
        />

        {/* Dynamic vignette that deepens as the portrait recedes into the background */}
        <motion.div
          initial={{ opacity: 0.2 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-black/70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/90" />
      </motion.div>

      {/* 
        HERO FOREGROUND LAYER
        The title and CTA buttons animate boldly forward from depth.
      */}
      <motion.div
        style={{ y: contentScrollY, opacity: contentOpacity }}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24"
      >
        {/* Luxury Badge - Hidden on mobile, visible on sm and up */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="hidden sm:inline-flex items-center space-x-2 border border-blue-400/40 bg-background/80 backdrop-blur-md px-4 py-1.5 mb-6 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-[0.25em] text-blue-200 uppercase font-semibold">
            {dict.badge}
          </span>
        </motion.div>

        {/* 
          CTA BUTTONS FLYING FORWARD INTO THE FOREGROUND
          Notice: scale from 0 -> 1.0, translating from 0 with liquid glass glow.
        */}
        <motion.div
          initial={{ opacity: 0, scale: 0, filter: "blur(8px)" }}
          animate={{ opacity: isBookingOpen ? 0 : 1, scale: 1, filter: "blur(0px)" }}
          transition={{
            duration: 0.6,
            type: "spring",
            bounce: 0.4,
            delay: 0.15,
          }}
          className={`mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-300 ${isBookingOpen ? "pointer-events-none" : ""}`}
        >
          <Button
            size="md"
            variant="primary"
            onClick={() => setIsBookingOpen(true)}
            className="group w-full sm:w-auto py-3 px-6 sm:py-3.5 sm:px-8 text-xs sm:text-sm font-bold tracking-widest gap-2 sm:gap-2.5 rounded-full shadow-[0_4px_25px_rgba(255,255,255,0.15)] hover:shadow-[0_8px_35px_rgba(255,255,255,0.3)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="uppercase">{dict.bookNow}</span>
            <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-[ping-pong_1.5s_ease-in-out_infinite]" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Sliding Pre-rendered Booking Flow Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-[#14151a] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isBookingOpen 
            ? "opacity-100 pointer-events-auto translate-y-0" 
            : "opacity-0 pointer-events-none translate-y-[10px]"
        }`}
      >
        {services && addons && bookingDict && (
          <BookingWizard
            locale={locale}
            services={services}
            addons={addons}
            initialServiceId={initialServiceId}
            dict={bookingDict}
            currentUser={currentUser}
            onClose={() => {
              setIsBookingOpen(false);
              if (searchParams.get("book")) {
                window.history.replaceState({}, '', `/${locale}`);
              }
            }}
          />
        )}
      </div>
    </section>
  );
}
