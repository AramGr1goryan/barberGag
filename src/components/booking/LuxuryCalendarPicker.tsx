"use client";

import React, { useState, useRef, useEffect } from "react";
import { Locale } from "@/i18n/config";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldAlert,
  Check,
  X,
  Calendar as CalendarIcon,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

export interface LuxuryCalendarPickerProps {
  locale: Locale;
  openDates: string[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  availableSlots: { id: string; startTime: string; endTime: string }[];
  selectedSlotId: string;
  onSelectSlot: (slotId: string) => void;
  isDayClosed: boolean;
  isLoadingSlots?: boolean;
  dict: {
    selectDate: string;
    selectTime: string;
    noSlotsTitle: string;
    noSlotsDesc: string;
  };
}

export function LuxuryCalendarPicker({
  locale,
  openDates,
  selectedDate,
  onSelectDate,
  availableSlots,
  selectedSlotId,
  onSelectSlot,
  isDayClosed,
  isLoadingSlots = false,
  dict,
}: LuxuryCalendarPickerProps) {
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  // Current visible month in calendar view
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const wheelRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);

  // Keep month view in sync if selectedDate changes outside
  useEffect(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setCurrentMonthDate(new Date(y, m - 1, 1));
      }
    }
  }, [selectedDate]);

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed

  // Month names
  const monthNames = {
    hy: ["Հունվար", "Փետրվար", "Մարտ", "Ապրիլ", "Մայիս", "Հունիս", "Հուլիս", "Օգոստոս", "Սեպտեմբեր", "Հոկտեմբեր", "Նոյեմբեր", "Դեկտեմբեր"],
    ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  }[locale] || ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const weekDayLabels = {
    hy: ["Երկ", "Երք", "Չրք", "Հնգ", "Ուրբ", "Շբթ", "Կիր"],
    ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  }[locale] || ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  // Days in month calculation (Monday is first day = 0)
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Scroll wheel item height in px
  const ITEM_HEIGHT = 44;

  // Auto-scroll selected slot to center of iPhone picker wheel
  useEffect(() => {
    if (!isTimeModalOpen || !wheelRef.current || isUserScrollingRef.current || availableSlots.length === 0) return;
    const index = availableSlots.findIndex((s) => s.id === selectedSlotId);
    const targetIdx = index !== -1 ? index : 0;
    setTimeout(() => {
      wheelRef.current?.scrollTo({
        top: targetIdx * ITEM_HEIGHT,
        behavior: "smooth",
      });
      if (index === -1 && availableSlots[0]) {
        onSelectSlot(availableSlots[0].id);
      }
    }, 60);
  }, [selectedSlotId, availableSlots, isTimeModalOpen, onSelectSlot]);

  // Handle wheel scroll snapping detection
  const handleWheelScroll = () => {
    if (!wheelRef.current) return;
    isUserScrollingRef.current = true;
    const scrollTop = wheelRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);

    if (index >= 0 && index < availableSlots.length) {
      const slot = availableSlots[index];
      if (slot && slot.id !== selectedSlotId) {
        onSelectSlot(slot.id);
      }
    }

    clearTimeout((handleWheelScroll as unknown as { timeoutId: NodeJS.Timeout }).timeoutId);
    (handleWheelScroll as unknown as { timeoutId: NodeJS.Timeout }).timeoutId = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 120);
  };

  const handleDayClick = (dateStr: string) => {
    onSelectDate(dateStr);
    setIsTimeModalOpen(true);
  };

  const selectedSlot = availableSlots.find((s) => s.id === selectedSlotId);

  // Formatted date string for header
  const getFormattedSelectedDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const localeCode = locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US";
    return dateObj.toLocaleDateString(localeCode, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* CALENDAR SECTION (COMPACT LUXURY DESIGN) */}
      <div className="bg-[#121216]/90 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 backdrop-blur-xl">
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest text-accent uppercase font-semibold flex items-center gap-1">
              <CalendarIcon className="w-3 h-3 text-accent" />
              {dict.selectDate}
            </span>
            <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-wide">
              {monthNames[month]} {year}
            </h3>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={goToToday}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[10px] font-mono text-muted hover:text-white transition-all"
            >
              {locale === "ru" ? "Сегодня" : locale === "hy" ? "Այսօր" : "Today"}
            </button>
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-muted hover:text-foreground transition-all"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-muted hover:text-foreground transition-all"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-[10px] font-mono text-muted">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            <span>
              {locale === "hy"
                ? "Հասանելի օրեր"
                : locale === "ru"
                ? "Доступные дни"
                : "Available days"}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(197,168,128,0.6)]" />
            <span>
              {locale === "hy"
                ? "Ընտրված օր"
                : locale === "ru"
                ? "Выбранный день"
                : "Selected day"}
            </span>
          </div>
        </div>

        {/* Week Day Header Labels */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
          {weekDayLabels.map((day, idx) => (
            <span
              key={idx}
              className={`text-[10px] font-mono uppercase tracking-wider py-0.5 font-semibold ${
                idx >= 5 ? "text-amber-400/80" : "text-muted/80"
              }`}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Month Day Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-10 sm:h-11 rounded-xl bg-white/[0.01] opacity-20" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isOpen = openDates.includes(dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={!isOpen}
                onClick={() => handleDayClick(dateStr)}
                className={`group relative h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center transition-all duration-150 border ${
                  isSelected
                    ? "bg-accent text-slate-950 font-bold border-accent shadow-[0_0_15px_rgba(197,168,128,0.5)] scale-105 z-10"
                    : isOpen
                    ? "bg-white/[0.03] hover:bg-white/[0.08] border-emerald-500/30 hover:border-emerald-400 text-white cursor-pointer"
                    : "bg-surface/20 text-white/20 border-transparent cursor-not-allowed"
                }`}
              >
                <span className="text-xs font-display font-medium">
                  {dayNum}
                </span>

                {/* Available day status dot */}
                {isOpen && (
                  <span
                    className={`mt-0.5 rounded-full transition-all duration-150 ${
                      isSelected
                        ? "w-3 h-0.5 bg-slate-950/80"
                        : "w-1.5 h-1.5 bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)] group-hover:w-2.5 group-hover:h-0.5"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Slot Summary Badge Under Calendar */}
        {selectedDate && selectedSlot && (
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-[11px] font-mono">
              <span className="text-muted">
                {locale === "hy" ? "Ընտրված է՝" : locale === "ru" ? "Выбрано:" : "Selected:"}
              </span>
              <span className="text-foreground font-bold">{selectedDate}</span>
              <span className="text-accent font-bold">({selectedSlot.startTime} – {selectedSlot.endTime})</span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTimeModalOpen(true)}
              className="gap-1.5 py-1 px-3 text-[10px] font-mono rounded-xl"
            >
              <Clock className="w-3 h-3 text-accent" />
              <span>
                {locale === "hy"
                  ? "Փոխել ժամը (Այֆոնի ոճով)"
                  : locale === "ru"
                  ? "Выбрать время (будильник)"
                  : "Change Time"}
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* POPUP MODAL: IPHONE ALARM STYLE DRUM WHEEL TIME PICKER */}
      <AnimatePresence>
        {isTimeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with heavy blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsTimeModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-xl"
            />

            {/* Popup Modal Box with smooth animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xs sm:max-w-sm bg-[#121216]/98 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-10 overflow-hidden"
            >
              {/* Subtle gold ambient glow */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-20 bg-accent/20 blur-3xl pointer-events-none rounded-full" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsTimeModalOpen(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-muted hover:text-foreground transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Modal Header */}
              <div className="text-center mb-4">
                <span className="text-[10px] font-mono tracking-widest text-accent uppercase font-semibold block mb-0.5">
                  {locale === "hy"
                    ? "Ընտրեք ազատ ժամը"
                    : locale === "ru"
                    ? "Выберите время"
                    : "Pick Time"}
                </span>
                <h4 className="font-display text-base sm:text-lg font-bold text-foreground capitalize">
                  {getFormattedSelectedDate(selectedDate)}
                </h4>
              </div>

              {/* Loading State */}
              {isLoadingSlots ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-muted">
                    {locale === "ru"
                      ? "Загрузка доступных часов..."
                      : "Բեռնվում են ազատ ժամերը..."}
                  </span>
                </div>
              ) : isDayClosed || availableSlots.length === 0 ? (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-2">
                  <ShieldAlert className="w-6 h-6 text-muted mx-auto" />
                  <p className="text-xs text-foreground font-semibold font-mono">{dict.noSlotsTitle}</p>
                  <p className="text-[11px] text-muted leading-relaxed">{dict.noSlotsDesc}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* IPHONE ALARM STYLE DRUM WHEEL CONTAINER */}
                  <div className="relative h-[176px] overflow-hidden rounded-2xl bg-[#09090d] border border-white/10 shadow-inner">
                    {/* Center Selection Lens / Glass highlight */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 h-11 rounded-xl bg-accent/[0.08] border border-accent/40 shadow-[0_0_15px_rgba(197,168,128,0.2)] pointer-events-none z-10" />

                    {/* Top & Bottom gradient mask for 3D iOS depth fade */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#09090d] via-[#09090d]/80 to-transparent pointer-events-none z-20" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#09090d] via-[#09090d]/80 to-transparent pointer-events-none z-20" />

                    {/* Scrollable Drum List */}
                    <div
                      ref={wheelRef}
                      onScroll={handleWheelScroll}
                      className="h-full overflow-y-auto snap-y snap-mandatory py-[66px] no-scrollbar select-none"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlotId === slot.id;
                        return (
                          <div
                            key={slot.id}
                            onClick={() => {
                              onSelectSlot(slot.id);
                            }}
                            className={`h-11 flex items-center justify-center snap-center cursor-pointer transition-all duration-150 font-mono ${
                              isSelected
                                ? "text-accent font-bold text-xl scale-110 tracking-widest z-10"
                                : "text-muted/50 hover:text-foreground text-xs scale-95"
                            }`}
                          >
                            <span>{slot.startTime}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-center text-[10px] font-mono text-muted/60 uppercase tracking-wider">
                    {locale === "hy"
                      ? "Թերթեք ինչպես այֆոնի զարթուցիչում"
                      : locale === "ru"
                      ? "Прокрутите барабан как в будильнике iPhone"
                      : "Scroll drum like iPhone alarm"}
                  </p>

                  {/* Confirm Button */}
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!selectedSlotId}
                    onClick={() => setIsTimeModalOpen(false)}
                    className="w-full py-2.5 text-xs font-mono font-bold gap-2 rounded-xl"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {selectedSlot
                        ? `${locale === "hy" ? "Հաստատել" : locale === "ru" ? "Выбрать" : "Confirm"} ${selectedSlot.startTime}`
                        : locale === "hy"
                        ? "Հաստատել"
                        : locale === "ru"
                        ? "Выбрать"
                        : "Confirm"}
                    </span>
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
