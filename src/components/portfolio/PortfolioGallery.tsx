"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Locale } from "@/i18n/config";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Eye, Sparkles } from "lucide-react";

export interface PortfolioItem {
  id: string;
  url: string;
  titleHy: string;
  titleRu: string;
  titleEn: string;
  altHy: string;
  altRu: string;
  altEn: string;
  category: string;
}

export interface PortfolioGalleryProps {
  locale: Locale;
  items: PortfolioItem[];
  dict: {
    all: string;
    classic: string;
    fade: string;
    beard: string;
    styling: string;
  };
}

export function PortfolioGallery({ locale, items, dict }: PortfolioGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const getTitle = (item: PortfolioItem) =>
    locale === "ru" ? item.titleRu : locale === "en" ? item.titleEn : item.titleHy;

  const getAlt = (item: PortfolioItem) =>
    locale === "ru" ? item.altRu : locale === "en" ? item.altEn : item.altHy;

  const categories = [
    { key: "all", label: dict.all },
    { key: "classic", label: dict.classic },
    { key: "fade", label: dict.fade },
    { key: "beard", label: dict.beard },
    { key: "styling", label: dict.styling },
  ];

  const filteredItems =
    activeCategory === "all"
      ? items
      : items.filter((item) => item.category.toLowerCase() === activeCategory.toLowerCase());

  const handlePrev = useCallback(() => {
    if (selectedIdx === null) return;
    setSelectedIdx((prev) => (prev! > 0 ? prev! - 1 : filteredItems.length - 1));
  }, [selectedIdx, filteredItems.length]);

  const handleNext = useCallback(() => {
    if (selectedIdx === null) return;
    setSelectedIdx((prev) => (prev! < filteredItems.length - 1 ? prev! + 1 : 0));
  }, [selectedIdx, filteredItems.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIdx === null) return;
      if (e.key === "Escape") setSelectedIdx(null);
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIdx, handlePrev, handleNext]);

  return (
    <div className="space-y-12">
      {/* Category Tabs: Liquid Glass Pill Container */}
      <div className="flex justify-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-2 rounded-full bg-[#161924]/80 border border-white/[0.1] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] ring-1 ring-white/5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(cat.key);
                  setSelectedIdx(null);
                }}
                className={`px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-mono transition-all duration-300 ${
                  isActive
                    ? "bg-accent text-accent-foreground font-bold shadow-[0_4px_20px_rgba(197,168,128,0.35)] scale-100"
                    : "text-muted hover:text-foreground hover:bg-white/5"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gallery Grid with Liquid Glass Bento Cards */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35 }}
              key={item.id}
              onClick={() => setSelectedIdx(idx)}
              className="group relative aspect-[4/5] rounded-3xl overflow-hidden bg-[#161924]/70 border border-white/[0.1] backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.3)] hover:border-accent/50 hover:shadow-[0_16px_40px_rgba(197,168,128,0.25)] hover:-translate-y-1.5 transition-all duration-500 cursor-pointer"
            >
              {/* Image */}
              <Image
                src={item.url}
                alt={getAlt(item)}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out filter contrast-[1.05]"
              />

              {/* Specular Liquid Glass Top Sheen */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-transparent pointer-events-none rounded-3xl" />

              {/* Category Pill floating at top right */}
              <div className="absolute top-4 right-4 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-xl text-[10px] uppercase font-mono tracking-widest text-accent font-semibold shadow-lg">
                  <Sparkles className="w-2.5 h-2.5" />
                  {item.category}
                </span>
              </div>

              {/* Hover Liquid Glass Info Panel */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c12]/95 via-[#0a0c12]/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 rounded-3xl">
                <div className="flex items-center space-x-2 text-accent mb-2">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] uppercase font-mono tracking-wider text-accent font-semibold">
                    View Details
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground leading-snug">
                  {getTitle(item)}
                </h3>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Accessible Liquid Glass Lightbox Modal */}
      <AnimatePresence>
        {selectedIdx !== null && filteredItems[selectedIdx] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            {/* Liquid Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIdx(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-2xl"
            />

            {/* Close Button Pill */}
            <button
              onClick={() => setSelectedIdx(null)}
              aria-label="Close Lightbox"
              className="absolute top-6 right-6 z-50 p-3 rounded-full text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl shadow-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              aria-label="Previous Image"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3.5 rounded-full text-white bg-black/60 hover:bg-accent hover:text-accent-foreground border border-white/15 hover:border-accent backdrop-blur-xl transition-all duration-200 shadow-xl"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              aria-label="Next Image"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3.5 rounded-full text-white bg-black/60 hover:bg-accent hover:text-accent-foreground border border-white/15 hover:border-accent backdrop-blur-xl transition-all duration-200 shadow-xl"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Lightbox Liquid Glass Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 max-w-4xl w-full max-h-[90vh] flex flex-col items-center bg-[#161924]/90 border border-white/[0.15] rounded-3xl p-4 sm:p-6 backdrop-blur-3xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
            >
              <div className="relative w-full h-[60vh] max-h-[650px] rounded-2xl overflow-hidden bg-black/40">
                <Image
                  src={filteredItems[selectedIdx].url}
                  alt={getAlt(filteredItems[selectedIdx])}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>

              <div className="mt-4 text-center space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-[10px] uppercase font-mono tracking-widest font-semibold">
                  {filteredItems[selectedIdx].category}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                  {getTitle(filteredItems[selectedIdx])}
                </h3>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
