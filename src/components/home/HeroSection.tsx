"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CallbackModal } from "@/components/callback/CallbackModal";
import { Locale } from "@/i18n/config";
import { Calendar, PhoneCall } from "lucide-react";

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
  callbackDict: {
    title: string;
    description: string;
    name: string;
    phone: string;
    preferredTime: string;
    message: string;
    submit: string;
    sending: string;
    success: string;
    close: string;
  };
}

export function HeroSection({
  locale,
  barberPhotoUrl = "/images/gagik-barber.jpg",
  dict,
  callbackDict,
}: HeroSectionProps) {
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      className="relative min-h-[96vh] flex items-center justify-center overflow-hidden -mt-20 pt-20 perspective-[1000px]"
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
          className="hidden sm:inline-flex items-center space-x-2 border border-accent/40 bg-background/80 backdrop-blur-md px-4 py-1.5 mb-6 rounded-full shadow-[0_0_20px_rgba(197,168,128,0.15)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] font-mono tracking-[0.25em] text-accent uppercase font-semibold">
            {dict.badge}
          </span>
        </motion.div>

        {/* 
          CTA BUTTONS FLYING FORWARD INTO THE FOREGROUND
          Notice: scale from 0.75 -> 1.0, translate forward with expansive gold glow.
        */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 45 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 1.1,
            delay: 0.75,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Link href={`/${locale}/booking`} className="w-full max-w-xs sm:max-w-none sm:w-auto">
            <Button
              size="md"
              variant="primary"
              className="w-full sm:w-auto py-2.5 px-6 sm:py-3 sm:px-7 text-xs tracking-wider gap-2 sm:gap-2.5 shadow-[0_0_25px_rgba(197,168,128,0.3)] hover:shadow-[0_0_45px_rgba(197,168,128,0.55)] transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{dict.bookNow}</span>
            </Button>
          </Link>

          <Button
            size="md"
            variant="secondary"
            onClick={() => setIsCallbackOpen(true)}
            className="w-full max-w-xs sm:max-w-none sm:w-auto py-2.5 px-6 sm:py-3 sm:px-7 text-xs tracking-wider gap-2 sm:gap-2.5 bg-surface/90 backdrop-blur-md border border-accent/40 shadow-[0_6px_20px_rgba(0,0,0,0.4)] hover:border-accent hover:shadow-[0_0_25px_rgba(197,168,128,0.25)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
            <span>{dict.requestCallback}</span>
          </Button>
        </motion.div>
      </motion.div>


      {/* Callback Request Modal */}
      <CallbackModal
        isOpen={isCallbackOpen}
        onClose={() => setIsCallbackOpen(false)}
        dict={callbackDict}
      />
    </section>
  );
}
