"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import {
  CalendarDays,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Clock,
  User,
  Phone,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";

export interface AdminSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED" | "CANCELLED";
  booking?: {
    id: string;
    bookingNumber: string;
    guestName: string;
    guestPhone: string;
    status: string;
  } | null;
}

export interface AdminDayData {
  date: string;
  isOpen: boolean;
  notes?: string | null;
  slots: AdminSlot[];
}

interface MonthDaySummary {
  date: string;
  isOpen: boolean;
  slots: { id: string; status: string }[];
}

const TIME_OPTIONS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"
];

export function CalendarManager() {
  const { t, locale } = useAdminI18n();

  // Selected date (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Month navigation (for the interactive calendar)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Data states
  const [dayData, setDayData] = useState<AdminDayData | null>(null);
  const [monthSummary, setMonthSummary] = useState<Record<string, MonthDaySummary>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Modals
  const [isSingleSlotModalOpen, setIsSingleSlotModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Single Slot Creator State (Specific date, specific hour, session duration)
  const [singleDate, setSingleDate] = useState(todayStr);
  const [singleTime, setSingleTime] = useState("12:00");
  const [singleDuration, setSingleDuration] = useState(60);
  const [isCreatingSingleSlot, setIsCreatingSingleSlot] = useState(false);

  // Bulk generator state
  const [bulkStart, setBulkStart] = useState("10:00");
  const [bulkEnd, setBulkEnd] = useState("20:00");
  const [bulkDuration, setBulkDuration] = useState(60);
  const [isGenerating, setIsGenerating] = useState(false);

  // Cooldown setting state
  const [cooldownHours, setCooldownHours] = useState<number>(3);
  const [customCooldownInput, setCustomCooldownInput] = useState<string>("3");
  const [isSavingCooldown, setIsSavingCooldown] = useState(false);
  const [cooldownSaved, setCooldownSaved] = useState(false);

  // Filter slots
  const [slotFilter, setSlotFilter] = useState<"ALL" | "AVAILABLE" | "BOOKED" | "BLOCKED">("ALL");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  // Fetch month summary for the calendar view
  const fetchMonthSummary = useCallback(async (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = (monthDate.getMonth() + 1).toString().padStart(2, "0");
    const monthStr = `${year}-${month}`;

    try {
      const res = await fetch(`/api/admin/calendar?month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, MonthDaySummary> = {};
        if (Array.isArray(data.days)) {
          data.days.forEach((d: MonthDaySummary) => {
            map[d.date] = d;
          });
        }
        setMonthSummary(map);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch single day status and slots
  const fetchDayData = useCallback(
    async (date: string) => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/calendar?date=${date}`);
        if (!res.ok) throw new Error("Failed to fetch calendar day");
        const data = await res.json();
        setDayData(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t.common.error);
      } finally {
        setIsLoading(false);
      }
    },
    [t.common.error]
  );

  // Initial load: cooldown & day data
  useEffect(() => {
    fetchDayData(selectedDate);
    fetchMonthSummary(currentMonth);

    fetch("/api/admin/settings/cooldown")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.cooldownHours === "number") {
          setCooldownHours(data.cooldownHours);
          setCustomCooldownInput(String(data.cooldownHours));
        }
      })
      .catch(() => {});
  }, [selectedDate, currentMonth, fetchDayData, fetchMonthSummary]);

  // Handle month navigation
  const handlePrevMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() - 1);
    setCurrentMonth(next);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };

  const handleTodayClick = () => {
    setSelectedDate(todayStr);
    const d = new Date();
    d.setDate(1);
    setCurrentMonth(d);
  };

  // Cooldown save handler
  const handleSaveCooldown = async (newHours: number) => {
    setIsSavingCooldown(true);
    setCooldownSaved(false);
    try {
      const res = await fetch("/api/admin/settings/cooldown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cooldownHours: newHours }),
      });
      if (res.ok) {
        const data = await res.json();
        const savedVal = typeof data.cooldownHours === "number" ? data.cooldownHours : newHours;
        setCooldownHours(savedVal);
        setCustomCooldownInput(String(savedVal));
        setCooldownSaved(true);
        setTimeout(() => setCooldownSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setIsSavingCooldown(false);
    }
  };

  // Toggle Day Open / Closed
  const handleToggleDay = async (open: boolean) => {
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleDay",
          date: selectedDate,
          isOpen: open,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update day status");
      }

      showNotification(
        open
          ? locale === "ru"
            ? `Дата ${selectedDate} открыта для записи`
            : locale === "hy"
            ? `${selectedDate} օրը բացված է`
            : `Date ${selectedDate} is now open`
          : locale === "ru"
          ? `Дата ${selectedDate} закрыта`
          : locale === "hy"
          ? `${selectedDate} օրը փակված է`
          : `Date ${selectedDate} is closed`
      );
      fetchDayData(selectedDate);
      fetchMonthSummary(currentMonth);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  };

  // Create Single Slot (Specific Date + Specific Hour + Duration)
  const handleCreateSingleSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSingleSlot(true);
    setError("");

    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSlot",
          date: singleDate,
          startTime: singleTime,
          durationMinutes: Number(singleDuration) || 60,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create slot");
      }

      const calculatedEndTime = data.slot?.endTime || "";
      showNotification(
        locale === "ru"
          ? `Слот ${singleTime}${calculatedEndTime ? ` - ${calculatedEndTime}` : ""} успешно открыт на ${singleDate}!`
          : locale === "hy"
          ? `Սլոտը ${singleTime}${calculatedEndTime ? ` - ${calculatedEndTime}` : ""} հաջողությամբ բացված է ${singleDate}-ի համար`
          : `Slot ${singleTime} opened on ${singleDate}!`
      );

      setIsSingleSlotModalOpen(false);
      setSelectedDate(singleDate);
      fetchDayData(singleDate);
      fetchMonthSummary(currentMonth);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setIsCreatingSingleSlot(false);
    }
  };

  // Bulk Generate Slots
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulkGenerate",
          date: selectedDate,
          startTime: bulkStart,
          endTime: bulkEnd,
          slotDurationMinutes: Number(bulkDuration) || 60,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      const count = data.count ?? data.createdCount ?? 0;
      showNotification(
        locale === "ru"
          ? `Создано ${count} слотов на ${selectedDate}`
          : `${t.common.success} (${count})`
      );
      setIsBulkModalOpen(false);
      fetchDayData(selectedDate);
      fetchMonthSummary(currentMonth);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Slot Available / Blocked
  const handleToggleSlotStatus = async (slot: AdminSlot) => {
    if (slot.status === "BOOKED" || slot.status === "HELD") return;
    const newStatus = slot.status === "AVAILABLE" ? "BLOCKED" : "AVAILABLE";

    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateSlotStatus",
          slotId: slot.id,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update slot status");
      fetchDayData(selectedDate);
      fetchMonthSummary(currentMonth);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  };

  // Delete slot
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm(t.calendar.confirmDeleteDay)) return;
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteSlot",
          slotId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete slot");
      }

      showNotification(t.common.success);
      fetchDayData(selectedDate);
      fetchMonthSummary(currentMonth);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.common.error);
    }
  };

  // Build calendar matrix for current month
  const renderMonthCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    // In Armenia / Europe, Monday is first day of week (0 = Monday, 6 = Sunday)
    const adjustedFirstDay = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayLabels =
      locale === "ru"
        ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
        : locale === "hy"
        ? ["Երկ", "Երք", "Չոր", "Հնգ", "Ուրբ", "Շաբ", "Կիր"]
        : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

    const calendarCells = [];

    // Empty cells before first day
    for (let i = 0; i < adjustedFirstDay; i++) {
      calendarCells.push(
        <div key={`empty-${i}`} className="h-14 sm:h-16 rounded-xl bg-white/[0.01] border border-white/[0.03] opacity-20" />
      );
    }

    // Days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      const isSelected = selectedDate === dayStr;
      const isToday = dayStr === todayStr;
      const dayInfo = monthSummary[dayStr];
      const isOpen = dayInfo?.isOpen;
      const totalSlots = dayInfo?.slots?.length || 0;
      const bookedSlots =
        dayInfo?.slots?.filter((s) => s.status === "BOOKED" || s.status === "HELD").length || 0;
      const availableSlots =
        dayInfo?.slots?.filter((s) => s.status === "AVAILABLE").length || 0;

      calendarCells.push(
        <button
          key={dayStr}
          type="button"
          onClick={() => {
            setSelectedDate(dayStr);
            setSingleDate(dayStr);
          }}
          className={`h-14 sm:h-16 p-1.5 sm:p-2 rounded-2xl transition-all flex flex-col justify-between items-start text-left relative group border ${
            isSelected
              ? "bg-accent/25 border-accent shadow-[0_0_25px_rgba(197,168,128,0.4)] ring-2 ring-accent scale-[1.02] z-10"
              : isOpen
              ? "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/35 cursor-pointer"
              : "bg-surface/40 border-white/5 hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          {/* Top row: day number & today tag */}
          <div className="w-full flex items-center justify-between">
            <span
              className={`text-xs font-mono font-bold ${
                isSelected
                  ? "text-accent"
                  : isToday
                  ? "text-amber-400"
                  : isOpen
                  ? "text-foreground"
                  : "text-muted"
              }`}
            >
              {day}
            </span>

            {isToday && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
            )}
          </div>

          {/* Bottom row: status indicators */}
          <div className="w-full flex items-center justify-between text-[10px] font-mono">
            {isOpen ? (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                <span className="text-emerald-300 font-semibold hidden sm:inline">
                  {availableSlots > 0 ? availableSlots : totalSlots}
                </span>
                {bookedSlots > 0 && (
                  <span className="text-accent font-semibold hidden sm:inline">
                    · {bookedSlots}👥
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[9px] text-muted/40 font-mono hidden sm:inline">
                {locale === "ru" ? "закр" : locale === "hy" ? "փակ" : "off"}
              </span>
            )}
          </div>
        </button>
      );
    }

    return (
      <div className="space-y-3">
        {/* Day name headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {dayLabels.map((lbl, idx) => (
            <div
              key={lbl}
              className={`text-[11px] font-mono font-medium uppercase py-1 ${
                idx >= 5 ? "text-amber-400/80" : "text-muted"
              }`}
            >
              {lbl}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">{calendarCells}</div>
      </div>
    );
  };

  // Helper date formatted
  const dayDateObj = new Date(selectedDate);
  const localeFormatted = locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US";
  const dayDisplay = dayDateObj.toLocaleDateString(localeFormatted, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const monthDisplay = currentMonth.toLocaleDateString(localeFormatted, {
    year: "numeric",
    month: "long",
  });

  // Calculate quick end-time preview for single slot modal
  const getCalculatedEndTime = (start: string, duration: number) => {
    if (!start) return "";
    const [h, m] = start.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return "";
    const total = h * 60 + m + duration;
    const endH = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const endM = (total % 60).toString().padStart(2, "0");
    return `${endH}:${endM}`;
  };

  const calculatedSingleEnd = getCalculatedEndTime(singleTime, singleDuration);

  // Filtered slots
  const filteredSlots = (dayData?.slots || []).filter((s) => {
    if (slotFilter === "AVAILABLE") return s.status === "AVAILABLE";
    if (slotFilter === "BOOKED") return s.status === "BOOKED" || s.status === "HELD";
    if (slotFilter === "BLOCKED") return s.status === "BLOCKED";
    return true;
  });

  const availableCount = (dayData?.slots || []).filter((s) => s.status === "AVAILABLE").length;
  const bookedCount = (dayData?.slots || []).filter(
    (s) => s.status === "BOOKED" || s.status === "HELD"
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-semibold">
              {t.dashboard.executiveOverview}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1 tracking-tight">
            {t.calendar.title}
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            {locale === "ru"
              ? "Управление графиком, индивидуальные часы сессий и открытые дни"
              : locale === "hy"
              ? "Գրաֆիկի կառավարում, անհատական սեսիաների ժամեր և բաց օրեր"
              : "Schedule management, bespoke session hours and open booking dates"}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSingleDate(selectedDate);
              setIsSingleSlotModalOpen(true);
            }}
            className="gap-2 rounded-xl shadow-[0_2px_15px_rgba(197,168,128,0.25)]"
          >
            <Clock className="w-4 h-4 text-accent-foreground" />
            <span>
              {locale === "ru"
                ? "Открыть конкретный час"
                : locale === "hy"
                ? "Բացել կոնկրետ ժամ"
                : "Open Specific Hour"}
            </span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsBulkModalOpen(true)}
            className="gap-2 rounded-xl border-white/15 bg-surface/80 hover:bg-white/[0.08]"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>{t.calendar.generateSlots}</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs font-mono text-emerald-300 flex items-center space-x-3 backdrop-blur-md shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl text-xs font-mono text-red-300 flex items-center space-x-3 backdrop-blur-md shadow-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Cooldown Settings Card */}
      <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 text-accent flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display text-sm font-bold text-foreground">
                  {locale === "hy"
                    ? "Չեղարկումից հետո արգելափակման ժամանակ"
                    : locale === "ru"
                    ? "Блокировка повторной записи после отмены"
                    : "Post-Cancellation Booking Cooldown"}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 font-semibold">
                  {cooldownHours === 0
                    ? locale === "ru"
                      ? "Выключено"
                      : "Disabled"
                    : `${cooldownHours} ${locale === "ru" ? "ч" : locale === "hy" ? "ժ" : "h"}`}
                </span>
              </div>
              <p className="text-xs text-muted">
                {locale === "hy"
                  ? "Քանի ժամով օգտատերը չի կարող նորից գրանցվել այցելությունը չեղարկելուց հետո (0 = անջատված):"
                  : locale === "ru"
                  ? "Сколько часов клиент не может повторно зарегистрироваться после отмены (0 = выключено):"
                  : "Hours a client is restricted from re-booking after cancelling (0 = disabled):"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {cooldownSaved && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {locale === "ru" ? "Сохранено" : locale === "hy" ? "Պահպանված է" : "Saved"}
              </span>
            )}
          </div>
        </div>

        {/* Cooldown controls: presets + custom input */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {[0, 1, 2, 3, 6, 12, 24].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => handleSaveCooldown(hours)}
                disabled={isSavingCooldown}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                  cooldownHours === hours
                    ? "bg-accent text-accent-foreground border-accent font-bold shadow-[0_2px_15px_rgba(197,168,128,0.3)]"
                    : "bg-white/[0.03] border-white/10 text-muted hover:text-foreground hover:border-white/20"
                }`}
              >
                {hours === 0
                  ? locale === "ru"
                    ? "0 ч (Выкл)"
                    : locale === "hy"
                    ? "0 ժ (Անջատված)"
                    : "0h (Off)"
                  : `${hours} ${locale === "hy" ? "ժամ" : locale === "ru" ? "ч" : "h"}`}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 bg-background/60 border border-white/10 rounded-xl px-3 py-1">
            <span className="text-xs text-muted font-mono">{locale === "ru" ? "Своё:" : locale === "hy" ? "Այլ:" : "Custom:"}</span>
            <input
              type="number"
              min="0"
              max="168"
              step="1"
              value={customCooldownInput}
              onChange={(e) => setCustomCooldownInput(e.target.value)}
              className="w-16 bg-transparent text-xs font-mono text-foreground focus:outline-none text-center"
              placeholder="ч"
            />
            <button
              type="button"
              onClick={() => {
                const parsed = parseFloat(customCooldownInput);
                if (!isNaN(parsed) && parsed >= 0) {
                  handleSaveCooldown(parsed);
                }
              }}
              disabled={isSavingCooldown}
              className="px-2.5 py-1 bg-accent/20 hover:bg-accent text-accent hover:text-accent-foreground rounded-lg text-[11px] font-mono font-medium transition-all"
            >
              {locale === "ru" ? "Задать" : locale === "hy" ? "Պահպանել" : "Set"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left is Luxury Month Calendar, Right is Selected Day Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Calendar Navigator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.18)] space-y-5">
            {/* Month switch header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
                  {locale === "ru" ? "Интерактивный календарь" : locale === "hy" ? "Օրացույց" : "Calendar"}
                </span>
                <h2 className="font-display text-lg sm:text-xl font-bold text-foreground capitalize">
                  {monthDisplay}
                </h2>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={handleTodayClick}
                  className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] font-mono text-muted hover:text-foreground transition-all mr-1"
                >
                  {locale === "ru" ? "Сегодня" : locale === "hy" ? "Այսօր" : "Today"}
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 text-muted hover:text-foreground hover:border-white/25 flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 text-muted hover:text-foreground hover:border-white/25 flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Grid */}
            {renderMonthCalendar()}

            {/* Quick date picker input */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs font-mono text-muted">
                <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                <span>{locale === "ru" ? "Выбрать дату:" : "Pick date:"}</span>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSingleDate(e.target.value);
                }}
                className="bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 rounded-xl px-3 py-1.5 text-xs font-mono text-white transition-all [color-scheme:dark]"
              />
            </div>

            {/* Calendar Legend */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-muted border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{locale === "ru" ? "Открыт" : "Open"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span>{locale === "ru" ? "Запись" : "Booked"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{locale === "ru" ? "Сегодня" : "Today"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Day Schedule & Slots (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Day Control Bar */}
          <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.18)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground capitalize">
                    {dayDisplay}
                  </h2>
                  {dayData?.isOpen ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      {locale === "ru" ? "ОТКРЫТ" : locale === "hy" ? "ԲԱՑ Է" : "OPEN"}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-500/15 border border-red-500/30 text-red-300">
                      {locale === "ru" ? "ЗАКРЫТ" : locale === "hy" ? "ՓԱԿ Է" : "CLOSED"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted font-mono">
                  {dayData?.isOpen
                    ? locale === "ru"
                      ? "Клиенты могут бронировать свободные слоты в этот день"
                      : t.calendar.openDayPrompt
                    : locale === "ru"
                    ? "День закрыт. Нажмите кнопку, чтобы открыть дату для клиентов."
                    : t.calendar.closedDayBanner}
                </p>
              </div>

              {/* Day Open/Close Actions */}
              <div className="flex items-center gap-2">
                {dayData?.isOpen ? (
                  <Button
                    variant="danger"
                    size="sm"
                    className="gap-2 rounded-xl"
                    onClick={() => handleToggleDay(false)}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t.calendar.deleteDay}</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-2 rounded-xl"
                    onClick={() => handleToggleDay(true)}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{t.calendar.openNewDate}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Quick action strip for the day */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSlotFilter("ALL")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition-all border ${
                    slotFilter === "ALL"
                      ? "bg-accent/20 border-accent text-accent font-bold"
                      : "bg-white/[0.02] border-white/10 text-muted hover:text-foreground"
                  }`}
                >
                  {t.common.all} ({dayData?.slots.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFilter("AVAILABLE")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition-all border ${
                    slotFilter === "AVAILABLE"
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold"
                      : "bg-white/[0.02] border-white/10 text-muted hover:text-foreground"
                  }`}
                >
                  {locale === "ru" ? "Свободные" : "Available"} ({availableCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSlotFilter("BOOKED")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition-all border ${
                    slotFilter === "BOOKED"
                      ? "bg-accent/20 border-accent text-accent font-bold"
                      : "bg-white/[0.02] border-white/10 text-muted hover:text-foreground"
                  }`}
                >
                  {locale === "ru" ? "Занятые" : "Booked"} ({bookedCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSingleDate(selectedDate);
                  setIsSingleSlotModalOpen(true);
                }}
                className="flex items-center space-x-1.5 text-xs font-mono text-accent hover:text-accent/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {locale === "ru" ? "+ Добавить час" : "+ Add Slot"}
                </span>
              </button>
            </div>
          </div>

          {/* Slots List */}
          <div className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-accent" />
                <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                  {t.calendar.slotBreakdown} ({filteredSlots.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-muted">
                {t.calendar.toggleSlotStatus}
              </span>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-xs font-mono text-muted flex flex-col items-center justify-center space-y-2">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span>{t.common.loading}</span>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <CalendarDays className="w-10 h-10 text-muted/40 mx-auto" />
                <p className="text-xs font-mono text-foreground font-semibold">
                  {dayData?.slots.length === 0
                    ? locale === "ru"
                      ? "На этот день еще нет часов"
                      : t.calendar.noDaysConfigured
                    : locale === "ru"
                    ? "Нет слотов по выбранному фильтру"
                    : "No slots matching filter"}
                </p>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  {locale === "ru"
                    ? "Откройте конкретный час с нужной длительностью или сгенерируйте график на весь день."
                    : t.calendar.subtitle}
                </p>

                <div className="pt-3 flex items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSingleDate(selectedDate);
                      setIsSingleSlotModalOpen(true);
                    }}
                    className="gap-2 rounded-xl"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{locale === "ru" ? "Открыть час" : "Open Hour"}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsBulkModalOpen(true)}
                    className="gap-2 rounded-xl"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>{t.calendar.generateSlots}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredSlots.map((slot) => {
                  const isBooked = slot.status === "BOOKED" || slot.status === "HELD";
                  const isAvailable = slot.status === "AVAILABLE";
                  const isBlocked = slot.status === "BLOCKED";

                  return (
                    <div
                      key={slot.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isBooked
                          ? "bg-accent/10 border-accent/40 shadow-[0_2px_15px_rgba(197,168,128,0.15)]"
                          : isBlocked
                          ? "bg-red-950/15 border-red-900/30 opacity-70"
                          : "bg-background/60 border-white/10 hover:border-accent/40 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-accent/80" />
                          <span className="font-mono text-sm font-bold text-foreground tracking-tight">
                            {slot.startTime} – {slot.endTime}
                          </span>
                        </div>

                        {isAvailable ? (
                          <Badge variant="green">{t.calendar.legendAvailable}</Badge>
                        ) : isBooked ? (
                          <Badge variant="gold">{t.calendar.legendBooked}</Badge>
                        ) : (
                          <Badge variant="red">{t.calendar.legendBlocked}</Badge>
                        )}
                      </div>

                      {/* Guest details if booked */}
                      {isBooked && slot.booking && (
                        <div className="my-2 p-3 bg-background/90 border border-accent/30 rounded-xl space-y-1.5 text-[11px] font-mono">
                          <div className="flex items-center space-x-1.5 text-accent font-semibold truncate">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span>{slot.booking.guestName}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-muted truncate">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{slot.booking.guestPhone}</span>
                          </div>
                          <span className="text-[10px] text-muted/80 block font-mono">
                            #{slot.booking.bookingNumber}
                          </span>
                        </div>
                      )}

                      {/* Actions Bar */}
                      <div className="mt-2 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                        {!isBooked ? (
                          <button
                            type="button"
                            onClick={() => handleToggleSlotStatus(slot)}
                            className="text-[11px] font-mono text-muted hover:text-foreground underline transition-colors"
                          >
                            {isAvailable ? t.calendar.blocked : t.calendar.bookable}
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-accent">
                            {t.calendar.booked}
                          </span>
                        )}

                        {!isBooked && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-red-400/80 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                            title={t.common.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Открыть конкретный час с длительностью сессии */}
      <Modal
        isOpen={isSingleSlotModalOpen}
        onClose={() => setIsSingleSlotModalOpen(false)}
        title={
          locale === "ru"
            ? "Открыть конкретный час"
            : locale === "hy"
            ? "Բացել կոնկրետ ժամ"
            : "Open Specific Hour"
        }
        description={
          locale === "ru"
            ? "Укажите точное время начала и длительность сессии. День автоматически станет открытым."
            : locale === "hy"
            ? "Նշեք սկզբի ժամը և տևողությունը: Օրը ավտոմատ կդառնա բաց:"
            : "Specify exact start time and session duration. The day will automatically be marked open."
        }
      >
        <form onSubmit={handleCreateSingleSlot} className="space-y-4 py-1">
          {/* Date Picker + Quick Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-muted uppercase font-semibold">
                {t.calendar.selectDate}
              </label>
              <span className="text-[10px] font-mono text-accent font-semibold">{singleDate}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: locale === "ru" ? "Выбранный день" : "Ընտրված օր", date: selectedDate },
                { label: locale === "ru" ? "Сегодня" : "Այսօր", date: todayStr },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setSingleDate(p.date)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all border ${
                    singleDate === p.date
                      ? "bg-accent text-slate-950 border-accent font-bold"
                      : "bg-[#18181f] border-white/15 text-white/70 hover:text-white"
                  }`}
                >
                  {p.label} ({p.date})
                </button>
              ))}

              <input
                type="date"
                required
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="w-full bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 rounded-xl px-3 py-2 text-xs font-mono text-white transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Time Picker DROPDOWN & Quick Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-muted uppercase font-semibold">
                {t.calendar.startTime} (Dropdown)
              </label>
              <span className="text-[10px] font-mono text-accent font-semibold">
                ⏰ {singleTime}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={singleTime}
                onChange={(e) => setSingleTime(e.target.value)}
                className="w-full bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-3.5 py-2 text-xs font-mono transition-all [color-scheme:dark]"
              >
                {TIME_OPTIONS.map((timePreset) => (
                  <option key={timePreset} value={timePreset}>
                    ⏰ {timePreset}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted shrink-0">
                  {locale === "ru" ? "Точный:" : "Exact:"}
                </span>
                <input
                  type="time"
                  required
                  value={singleTime}
                  onChange={(e) => setSingleTime(e.target.value)}
                  className="flex-1 bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 rounded-xl px-3 py-1.5 text-xs font-mono text-white transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Quick time chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map((timePreset) => (
                <button
                  key={timePreset}
                  type="button"
                  onClick={() => setSingleTime(timePreset)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all border ${
                    singleTime === timePreset
                      ? "bg-accent text-accent-foreground border-accent font-bold shadow-[0_0_8px_rgba(197,168,128,0.4)]"
                      : "bg-white/[0.03] border-white/10 text-muted hover:text-foreground hover:border-white/25"
                  }`}
                >
                  {timePreset}
                </button>
              ))}
            </div>
          </div>

          {/* Session Duration Selector DROPDOWN */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-muted uppercase font-semibold">
                {locale === "ru"
                  ? "Длительность сессии"
                  : locale === "hy"
                  ? "Սեսիայի տևողություն"
                  : "Session Duration"}
              </label>
              <span className="text-[10px] font-mono text-accent font-semibold">
                {singleDuration} {locale === "ru" ? "мин" : "min"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={singleDuration}
                onChange={(e) => setSingleDuration(Number(e.target.value))}
                className="w-full bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-3.5 py-2 text-xs font-mono transition-all [color-scheme:dark]"
              >
                <option value={30}>30 мин (0.5ч)</option>
                <option value={45}>45 мин (0.75ч)</option>
                <option value={60}>60 мин (1.0ч)</option>
                <option value={75}>75 мин (1.25ч)</option>
                <option value={90}>90 мин (1.5ч)</option>
                <option value={120}>120 мин (2.0ч)</option>
              </select>

              {/* Duration Quick Pills */}
              <div className="grid grid-cols-4 gap-1">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSingleDuration(mins)}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-mono transition-all border text-center ${
                      singleDuration === mins
                        ? "bg-accent text-accent-foreground border-accent font-bold"
                        : "bg-white/[0.03] border-white/10 text-muted hover:text-foreground"
                    }`}
                  >
                    {mins}м
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slot Preview */}
          <div className="p-3 rounded-2xl bg-accent/10 border border-accent/30 space-y-1 text-xs font-mono">
            <span className="text-[10px] text-accent uppercase font-bold tracking-wider block">
              {locale === "ru" ? "Предпросмотр слота" : "Slot Preview"}
            </span>
            <div className="flex items-center justify-between text-foreground">
              <span>📅 {singleDate}</span>
              <span className="font-bold text-accent">
                ⏰ {singleTime} – {calculatedSingleEnd} ({singleDuration} {locale === "ru" ? "мин" : "min"})
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex justify-end space-x-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsSingleSlotModalOpen(false)}
              className="rounded-xl"
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isCreatingSingleSlot}
              className="rounded-xl shadow-[0_2px_15px_rgba(197,168,128,0.25)]"
            >
              {locale === "ru" ? "Открыть час" : "Open Slot"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Bulk Slot Generator */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title={t.calendar.generateSlots}
        description={`${t.calendar.selectDate}: ${selectedDate}`}
      >
        <form onSubmit={handleBulkGenerate} className="space-y-4 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-muted uppercase font-semibold">
                {t.calendar.startTime} (Dropdown)
              </label>
              <select
                value={bulkStart}
                onChange={(e) => setBulkStart(e.target.value)}
                className="w-full bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-3 py-2 text-xs font-mono transition-all [color-scheme:dark]"
              >
                {TIME_OPTIONS.map((tVal) => (
                  <option key={tVal} value={tVal}>
                    ⏰ {tVal}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-mono text-muted uppercase font-semibold">
                {t.calendar.endTime} (Dropdown)
              </label>
              <select
                value={bulkEnd}
                onChange={(e) => setBulkEnd(e.target.value)}
                className="w-full bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-3 py-2 text-xs font-mono transition-all [color-scheme:dark]"
              >
                {TIME_OPTIONS.map((tVal) => (
                  <option key={tVal} value={tVal}>
                    ⏰ {tVal}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-mono text-muted uppercase font-semibold">
                {t.calendar.slotDurationMinutes}
              </label>
              <span className="text-[10px] font-mono text-accent font-semibold">
                {bulkDuration} {locale === "ru" ? "мин" : "min"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={bulkDuration}
                onChange={(e) => setBulkDuration(Number(e.target.value))}
                className="w-full bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-3 py-2 text-xs font-mono transition-all [color-scheme:dark]"
              >
                <option value={30}>30 мин (0.5ч)</option>
                <option value={45}>45 мин (0.75ч)</option>
                <option value={60}>60 мин (1.0ч)</option>
                <option value={75}>75 мин (1.25ч)</option>
                <option value={90}>90 мин (1.5ч)</option>
                <option value={120}>120 мин (2.0ч)</option>
              </select>

              <div className="grid grid-cols-4 gap-1">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setBulkDuration(mins)}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-mono transition-all border text-center ${
                      bulkDuration === mins
                        ? "bg-accent text-accent-foreground border-accent font-bold shadow-[0_0_8px_rgba(197,168,128,0.3)]"
                        : "bg-white/[0.03] border-white/10 text-muted hover:text-foreground"
                    }`}
                  >
                    {mins}м
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="rounded-xl"
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isGenerating}
              className="rounded-xl shadow-[0_2px_15px_rgba(197,168,128,0.25)]"
            >
              {t.calendar.generateSlots}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
