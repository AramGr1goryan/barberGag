"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  CalendarCheck2,
  CalendarDays,
  Plus,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  ChevronRight,
  ExternalLink,
  Unlock,
  ShieldCheck,
  Layers,
  Search,
} from "lucide-react";

interface OpenDayItem {
  id: string;
  date: string;
  isOpen: boolean;
  notes?: string | null;
  totalSlots: number;
  availableSlots: number;
  totalBookings: number;
  completedBookings: number;
}

interface ServiceItem {
  id: string;
  nameRu: string;
  nameHy: string;
  nameEn: string;
  priceMinorUnits: number;
  durationMinutes: number;
}

interface BookingTask {
  id: string;
  bookingNumber: string;
  guestName: string;
  guestPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  totalPriceMinorUnits: number;
  status: "PENDING_VERIFICATION" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  items: {
    id: string;
    nameSnapshot: string;
    priceSnapshotMinor: number;
    durationSnapshotMin: number;
  }[];
  slot?: {
    id: string;
    status: string;
    startTime: string;
    endTime: string;
  } | null;
}

interface DaySlot {
  id: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED" | "CANCELLED";
}

const TIME_OPTIONS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

const getOffsetDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export function BarberCalendarManager() {
  const { t, locale } = useAdminI18n();

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [openDays, setOpenDays] = useState<OpenDayItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [dayBookings, setDayBookings] = useState<BookingTask[]>([]);
  const [daySlots, setDaySlots] = useState<DaySlot[]>([]);
  const [isDayOpen, setIsDayOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Filter tasks: "ALL" | "PENDING" | "COMPLETED"
  const [taskFilter, setTaskFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  // Modals
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [isOpenDateModalOpen, setIsOpenDateModalOpen] = useState(false);

  // Manual Booking Form State
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [bookingTime, setBookingTime] = useState("12:00");
  const [bookingDuration, setBookingDuration] = useState(60);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+374 ");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [customServiceName, setCustomServiceName] = useState("");
  const [bookingPrice, setBookingPrice] = useState("10000");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Open Day / Session Form State
  const [newOpenDate, setNewOpenDate] = useState(todayStr);
  const [newOpenStartTime, setNewOpenStartTime] = useState("10:00");
  const [newOpenDuration, setNewOpenDuration] = useState(60);
  const [isSubmittingOpenDate, setIsSubmittingOpenDate] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  // Fetch all barber calendar data
  const fetchData = useCallback(
    async (targetDate: string) => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/barber-calendar?date=${targetDate}`);
        if (!res.ok) throw new Error("Failed to load barber calendar data");
        const data = await res.json();

        setOpenDays(data.openDays || []);
        setServices(data.services || []);

        if (data.selectedDayDetails) {
          setDayBookings(data.selectedDayDetails.bookings || []);
          setDaySlots(data.selectedDayDetails.slots || []);
          setIsDayOpen(data.selectedDayDetails.isOpen || false);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t.common.error);
      } finally {
        setIsLoading(false);
      }
    },
    [t.common.error]
  );

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate, fetchData]);

  // Handle checking off a task (Toggle COMPLETED / CONFIRMED)
  const handleToggleTask = async (task: BookingTask) => {
    const isCurrentlyCompleted = task.status === "COMPLETED";
    const nextCompleted = !isCurrentlyCompleted;

    // Optimistic UI update
    setDayBookings((prev) =>
      prev.map((b) =>
        b.id === task.id
          ? { ...b, status: nextCompleted ? "COMPLETED" : "CONFIRMED" }
          : b
      )
    );

    try {
      const res = await fetch("/api/admin/barber-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleTask",
          bookingId: task.id,
          completed: nextCompleted,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update task status");
      }

      showNotification(
        nextCompleted
          ? locale === "ru"
            ? `Работа "${task.guestName}" отмечена выполненной!`
            : locale === "hy"
            ? `«${task.guestName}» աշխատանքը նշվեց որպես կատարված:`
            : `Task for "${task.guestName}" marked completed!`
          : locale === "ru"
          ? `Работа возвращена в статус активной`
          : locale === "hy"
          ? `Աշխատանքը վերադարձվեց ընթացիկ կարգավիճակ`
          : `Task reverted to active`
      );

      // Refresh open days count
      fetchData(selectedDate);
    } catch (err: unknown) {
      // Revert optimistic update on error
      setDayBookings((prev) =>
        prev.map((b) => (b.id === task.id ? { ...b, status: task.status } : b))
      );
      setError(err instanceof Error ? err.message : "Error updating task");
    }
  };

  // Open manual booking modal for a specific slot
  const handleOpenBookingForSlot = (slot: DaySlot) => {
    setBookingDate(selectedDate);
    setBookingTime(slot.startTime);
    const [startH, startM] = slot.startTime.split(":").map(Number);
    const [endH, endM] = slot.endTime.split(":").map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    if (duration > 0) setBookingDuration(duration);
    setIsManualBookingOpen(true);
  };

  // Handle service selection change in booking form
  const handleServiceSelectChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const found = services.find((s) => s.id === serviceId);
    if (found) {
      setCustomServiceName(
        locale === "ru" ? found.nameRu : locale === "hy" ? found.nameHy : found.nameEn
      );
      setBookingDuration(found.durationMinutes);
      setBookingPrice(String(Math.round(found.priceMinorUnits / 100)));
    }
  };

  // Submit manual booking (fast, zero required fields)
  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBooking(true);
    setError("");

    const finalClientName =
      clientName.trim() ||
      (locale === "ru" ? "Клиент" : locale === "hy" ? "Հաճախորդ" : "Client");
    const finalClientPhone =
      clientPhone.trim() === "+374" || !clientPhone.trim() ? "—" : clientPhone.trim();
    const finalServiceName =
      customServiceName.trim() ||
      (locale === "ru" ? "Стрижка" : locale === "hy" ? "Մազահարդարում" : "Service");

    try {
      const res = await fetch("/api/admin/barber-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createManualBooking",
          date: bookingDate,
          startTime: bookingTime,
          durationMinutes: bookingDuration,
          guestName: finalClientName,
          guestPhone: finalClientPhone,
          serviceId: selectedServiceId || null,
          serviceName: finalServiceName,
          price: Number(bookingPrice) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      showNotification(
        locale === "ru"
          ? `Клиент "${finalClientName}" записан на ${bookingDate} в ${bookingTime}!`
          : locale === "hy"
          ? `Հաճախորդ «${finalClientName}»-ը գրանցվեց ${bookingDate}-ին, ժամը ${bookingTime}-ին:`
          : `Client "${finalClientName}" booked for ${bookingDate} at ${bookingTime}!`
      );

      setIsManualBookingOpen(false);
      setClientName("");
      setClientPhone("+374 ");
      setCustomServiceName("");
      setSelectedServiceId("");

      setSelectedDate(bookingDate);
      fetchData(bookingDate);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating booking");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Submit opening a date / specific hour
  const handleOpenDateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOpenDate(true);
    setError("");

    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSlot",
          date: newOpenDate,
          startTime: newOpenStartTime,
          durationMinutes: newOpenDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to open date");
      }

      showNotification(
        locale === "ru"
          ? `Дата ${newOpenDate} и час ${newOpenStartTime} успешно открыты!`
          : locale === "hy"
          ? `${newOpenDate} օրը և ${newOpenStartTime} ժամը բացված են:`
          : `Date ${newOpenDate} and hour ${newOpenStartTime} opened!`
      );

      setIsOpenDateModalOpen(false);
      setSelectedDate(newOpenDate);
      fetchData(newOpenDate);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error opening date");
    } finally {
      setIsSubmittingOpenDate(false);
    }
  };

  // Date formatting helpers
  const dayDateObj = new Date(selectedDate);
  const localeFormatted = locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US";
  const selectedDayFormatted = dayDateObj.toLocaleDateString(localeFormatted, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Filter tasks
  const filteredTasks = dayBookings.filter((b) => {
    if (b.status === "CANCELLED") return false; // hide cancelled from task list
    if (taskFilter === "COMPLETED") return b.status === "COMPLETED";
    if (taskFilter === "PENDING") return b.status !== "COMPLETED";
    return true;
  });

  const completedCount = dayBookings.filter((b) => b.status === "COMPLETED").length;
  const activeCount = dayBookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PENDING_VERIFICATION"
  ).length;
  const totalTasksCount = completedCount + activeCount;

  // Available free slots for selected day
  const availableSlots = daySlots.filter((s) => s.status === "AVAILABLE");

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 md:pb-8">
      {/* Top Header */}
      <div className="bg-surface/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-bold">
                {locale === "ru"
                  ? "РАБОЧЕЕ МЕСТО МАСТЕРА"
                  : locale === "hy"
                  ? "ՎԱՐՊԵՏԻ ԱՇԽԱՏԱՎԱՅՐ"
                  : "BARBER WORKSPACE"}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1 tracking-tight">
              {t.barberCalendar.title}
            </h1>
            <p className="text-xs text-muted font-mono mt-0.5">
              {t.barberCalendar.subtitle}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setBookingDate(selectedDate);
                setIsManualBookingOpen(true);
              }}
              className="gap-2 rounded-xl shadow-[0_4px_18px_rgba(197,168,128,0.3)]"
            >
              <Plus className="w-4 h-4 text-accent-foreground" />
              <span className="font-bold">{t.barberCalendar.addClient}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setNewOpenDate(selectedDate);
                setIsOpenDateModalOpen(true);
              }}
              className="gap-2 rounded-xl border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
            >
              <Unlock className="w-4 h-4 text-accent" />
              <span>{t.barberCalendar.openHour}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs font-mono text-emerald-300 flex items-center space-x-3 backdrop-blur-md shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl text-xs font-mono text-red-300 flex items-center space-x-3 backdrop-blur-md shadow-lg animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Open Days Selector Ribbon (Mobile-Optimized Horizontal Swipe) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-muted">
              {t.barberCalendar.openDaysList} ({openDays.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewOpenDate(selectedDate);
              setIsOpenDateModalOpen(true);
            }}
            className="text-[11px] font-mono text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.barberCalendar.openDay}</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
          {openDays.map((dayItem) => {
            const isSelected = selectedDate === dayItem.date;
            const dateObj = new Date(dayItem.date);
            const weekday = dateObj.toLocaleDateString(localeFormatted, { weekday: "short" });
            const dayNumber = dateObj.getDate();
            const monthName = dateObj.toLocaleDateString(localeFormatted, { month: "short" });
            const isToday = dayItem.date === todayStr;

            return (
              <button
                key={dayItem.id}
                type="button"
                onClick={() => setSelectedDate(dayItem.date)}
                className={`flex-shrink-0 min-w-[95px] p-3 rounded-2xl border transition-all text-left flex flex-col justify-between relative group ${
                  isSelected
                    ? "bg-accent/20 border-accent shadow-[0_0_25px_rgba(197,168,128,0.3)] ring-1 ring-accent scale-[1.02]"
                    : "bg-surface/80 border-white/10 hover:border-white/25 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[10px] font-mono uppercase font-semibold ${
                      isSelected ? "text-accent" : "text-muted"
                    }`}
                  >
                    {weekday}
                  </span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                  )}
                </div>

                <div className="my-1">
                  <span
                    className={`text-xl font-display font-bold block leading-none ${
                      isSelected ? "text-foreground" : "text-foreground/90"
                    }`}
                  >
                    {dayNumber}
                  </span>
                  <span className="text-[10px] font-mono text-muted uppercase">
                    {monthName}
                  </span>
                </div>

                <div className="mt-1 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                  <span
                    className={
                      dayItem.completedBookings === dayItem.totalBookings &&
                      dayItem.totalBookings > 0
                        ? "text-emerald-400 font-bold"
                        : "text-accent font-semibold"
                    }
                  >
                    {dayItem.totalBookings > 0
                      ? `${dayItem.completedBookings}/${dayItem.totalBookings} ✓`
                      : `${dayItem.availableSlots} сп`}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Quick Add Day Button */}
          <button
            type="button"
            onClick={() => {
              setNewOpenDate(todayStr);
              setIsOpenDateModalOpen(true);
            }}
            className="flex-shrink-0 min-w-[95px] p-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-accent/40 transition-all flex flex-col items-center justify-center space-y-1.5 text-center text-muted hover:text-foreground"
          >
            <Plus className="w-5 h-5 text-accent" />
            <span className="text-[10px] font-mono uppercase leading-tight">
              {locale === "ru" ? "Открыть день" : locale === "hy" ? "Բացել օր" : "Open Day"}
            </span>
          </button>
        </div>
      </div>

      {/* Selected Day Workspace */}
      <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-5 sm:p-7 shadow-[0_12px_45px_rgba(0,0,0,0.18)] space-y-6">
        {/* Day Header & Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground capitalize">
                {selectedDayFormatted}
              </h3>
              {isDayOpen ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  {locale === "ru" ? "ДЕНЬ ОТКРЫТ" : locale === "hy" ? "ՕՐԸ ԲԱՑ Է" : "OPEN"}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 border border-red-500/30 text-red-300">
                  {locale === "ru" ? "ЗАКРЫТ" : locale === "hy" ? "ՓԱԿ Է" : "CLOSED"}
                </span>
              )}
            </div>

            {/* Task completion summary */}
            <div className="flex items-center gap-3 text-xs font-mono text-muted">
              <span>
                {locale === "ru"
                  ? `Задач выполнено: ${completedCount} из ${totalTasksCount}`
                  : locale === "hy"
                  ? `Կատարված է՝ ${completedCount} / ${totalTasksCount}`
                  : `Completed: ${completedCount} of ${totalTasksCount}`}
              </span>
              {totalTasksCount > 0 && (
                <span className="text-accent font-semibold">
                  ({Math.round((completedCount / totalTasksCount) * 100)}%)
                </span>
              )}
            </div>
          </div>

          {/* Task Filter Pills */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setTaskFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                taskFilter === "ALL"
                  ? "bg-accent text-accent-foreground border-accent font-bold shadow-[0_2px_10px_rgba(197,168,128,0.25)]"
                  : "bg-white/[0.03] border-white/10 text-muted hover:text-foreground"
              }`}
            >
              {t.barberCalendar.allTasks} ({totalTasksCount})
            </button>
            <button
              type="button"
              onClick={() => setTaskFilter("PENDING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                taskFilter === "PENDING"
                  ? "bg-amber-400 text-slate-950 border-amber-400 font-bold"
                  : "bg-white/[0.03] border-white/10 text-muted hover:text-foreground"
              }`}
            >
              {t.barberCalendar.pending} ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setTaskFilter("COMPLETED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                taskFilter === "COMPLETED"
                  ? "bg-emerald-500 text-slate-950 border-emerald-500 font-bold"
                  : "bg-white/[0.03] border-white/10 text-muted hover:text-foreground"
              }`}
            >
              {t.barberCalendar.completed} ({completedCount})
            </button>
          </div>
        </div>

        {/* Task Cards List (The Work Items of the day) */}
        {isLoading ? (
          <div className="py-16 text-center text-xs font-mono text-muted flex flex-col items-center justify-center space-y-3">
            <LoadingSpinner size="md" label={t.common.loading} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <CalendarCheck2 className="w-12 h-12 text-muted/30 mx-auto" />
            <p className="text-sm font-display font-semibold text-foreground">
              {locale === "ru" ? "Нет записей на этот день" : locale === "hy" ? "Այս օրվա համար գրանցումներ չկան" : "No bookings for this date"}
            </p>
            <p className="text-xs text-muted font-mono max-w-sm mx-auto">
              {locale === "ru"
                ? "Нажмите ниже, чтобы добавить клиента вручную или открыть часы для этого дня."
                : locale === "hy"
                ? "Սեղմեք ներքևում՝ հաճախորդ ավելացնելու կամ ժամերը բացելու համար:"
                : "Tap below to manually book a client or open hours for this date."}
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setBookingDate(selectedDate);
                  setIsManualBookingOpen(true);
                }}
                className="gap-2 rounded-xl"
              >
                <Plus className="w-4 h-4 text-accent-foreground" />
                <span>{t.barberCalendar.addClient}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isDone = task.status === "COMPLETED";
              const serviceNames =
                task.items.length > 0
                  ? task.items.map((i) => i.nameSnapshot).join(" + ")
                  : locale === "ru"
                  ? "Услуга мастера"
                  : "Barber Service";
              const priceFormatted = (task.totalPriceMinorUnits / 100).toLocaleString("hy-AM");

              return (
                <div
                  key={task.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                    isDone
                      ? "bg-emerald-950/15 border-emerald-500/30 opacity-75 shadow-sm"
                      : "bg-[#222533]/85 border-white/10 hover:border-accent/40 shadow-md hover:shadow-lg"
                  }`}
                >
                  {/* Left: Checkbox + Info */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {/* Big Touchable Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          : "bg-[#2a2e3f] border-accent/60 hover:border-accent text-transparent"
                      }`}
                      title={isDone ? t.barberCalendar.markPending : t.barberCalendar.markCompleted}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      {/* Time + Name */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-accent px-2 py-0.5 rounded-lg bg-[#252837] border border-accent/25">
                          ⏰ {task.startTime} – {task.endTime}
                        </span>

                        <span
                          className={`font-display text-sm sm:text-base font-bold truncate ${
                            isDone
                              ? "line-through text-muted"
                              : "text-foreground"
                          }`}
                        >
                          {task.guestName}
                        </span>

                        {isDone ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            ✓ {t.barberCalendar.completed}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                            ⏳ {t.barberCalendar.pending}
                          </span>
                        )}
                      </div>

                      {/* Service details */}
                      <p
                        className={`text-[11px] font-mono ${
                          isDone ? "text-muted/60 line-through" : "text-muted"
                        }`}
                      >
                        💈 {serviceNames} ({task.totalDurationMinutes} {locale === "ru" ? "мин" : "min"})
                      </p>

                      {/* Phone & Booking Ref */}
                      <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] font-mono">
                        <a
                          href={`tel:${task.guestPhone}`}
                          className="text-muted hover:text-accent flex items-center gap-1 transition-colors underline"
                        >
                          <Phone className="w-3 h-3 text-accent" />
                          <span>{task.guestPhone}</span>
                        </a>

                        <span className="text-[9px] text-muted/50">
                          #{task.bookingNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price + Action Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-accent block">
                        {priceFormatted} ֏
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-mono transition-all border font-semibold ${
                        isDone
                          ? "bg-white/[0.04] border-white/10 text-muted hover:text-foreground"
                          : "bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border-emerald-500/40 shadow-sm"
                      }`}
                    >
                      {isDone ? t.barberCalendar.markPending : t.barberCalendar.markCompleted}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Free / Available Slots on this day */}
        {availableSlots.length > 0 && (
          <div className="pt-5 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase font-bold text-muted tracking-wider">
                {locale === "ru"
                  ? `Свободные открытые часы (${availableSlots.length})`
                  : locale === "hy"
                  ? `Ազատ բաց ժամեր (${availableSlots.length})`
                  : `Available Open Slots (${availableSlots.length})`}
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {locale === "ru" ? "Можно записать" : "Ready to book"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleOpenBookingForSlot(slot)}
                  className="p-2.5 rounded-xl bg-[#141418] border border-white/15 hover:border-accent hover:bg-accent/10 transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span className="font-mono text-xs font-bold text-white">
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) on Mobile */}
      <div className="md:hidden fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => {
            setBookingDate(selectedDate);
            setIsManualBookingOpen(true);
          }}
          className="px-4 py-2.5 bg-accent text-slate-950 rounded-2xl shadow-[0_4px_25px_rgba(197,168,128,0.45)] font-mono font-bold text-xs flex items-center space-x-1.5 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.barberCalendar.addClient}</span>
        </button>
      </div>

      {/* Modal 1: Ultra-Fast Client Booking (Compact & Fully Visible) */}
      <Modal
        isOpen={isManualBookingOpen}
        onClose={() => setIsManualBookingOpen(false)}
        title={t.barberCalendar.addClient}
        description={
          locale === "ru"
            ? "Быстрое добавление записи: выберите время и услугу в 1 клик."
            : locale === "hy"
            ? "Արագ գրանցում՝ ընտրեք ժամն ու ծառայությունը 1 քլիքով:"
            : "Fast booking: pick time & service in 1 click."
        }
      >
        <form onSubmit={handleManualBookingSubmit} className="space-y-3 py-0.5">
          {/* Row 1: Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Date Picker */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  {t.barberCalendar.date}
                </label>
                <span className="text-[10px] font-mono text-accent font-semibold">{bookingDate}</span>
              </div>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full bg-[#16161c] border border-white/20 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-2.5 py-1.5 text-xs font-mono transition-all [color-scheme:dark]"
              />
            </div>

            {/* Time Selection Dropdown */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  {t.barberCalendar.time}
                </label>
                <span className="text-[10px] font-mono text-accent font-semibold">⏰ {bookingTime}</span>
              </div>
              <select
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full bg-[#16161c] border border-white/20 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-2.5 py-1.5 text-xs font-mono transition-all [color-scheme:dark]"
              >
                {TIME_OPTIONS.map((tVal) => (
                  <option key={tVal} value={tVal}>
                    ⏰ {tVal}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Service & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Service Selection Dropdown (2 cols) */}
            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  {t.barberCalendar.selectService}
                </label>
                {bookingPrice && (
                  <span className="text-[10px] font-mono text-accent font-semibold">
                    {Number(bookingPrice).toLocaleString()} ֏
                  </span>
                )}
              </div>
              <select
                value={selectedServiceId}
                onChange={(e) => handleServiceSelectChange(e.target.value)}
                className="w-full bg-[#16161c] border border-white/20 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-2.5 py-1.5 text-xs font-mono transition-all [color-scheme:dark]"
              >
                <option value="">
                  {locale === "ru"
                    ? "— Выберите услугу —"
                    : locale === "hy"
                    ? "— Ընտրեք ծառայությունը —"
                    : "— Select Service —"}
                </option>
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {locale === "ru" ? srv.nameRu : locale === "hy" ? srv.nameHy : srv.nameEn} ({Math.round(srv.priceMinorUnits / 100).toLocaleString()} ֏)
                  </option>
                ))}
                <option value="CUSTOM">
                  {locale === "ru"
                    ? "— Своя услуга (вручную) —"
                    : locale === "hy"
                    ? "— Սեփական ծառայություն —"
                    : "— Custom Service —"}
                </option>
              </select>
            </div>

            {/* Duration Dropdown (1 col) */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
                {t.barberCalendar.duration}
              </label>
              <select
                value={bookingDuration}
                onChange={(e) => setBookingDuration(Number(e.target.value))}
                className="w-full bg-[#16161c] border border-white/20 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-2.5 py-1.5 text-xs font-mono transition-all [color-scheme:dark]"
              >
                <option value={30}>30 мин (0.5ч)</option>
                <option value={45}>45 мин</option>
                <option value={60}>60 мин (1.0ч)</option>
                <option value={75}>75 мин</option>
                <option value={90}>90 мин (1.5ч)</option>
                <option value={120}>120 мин (2ч)</option>
              </select>
            </div>
          </div>

          {/* If Custom Service: show inline name & price */}
          {selectedServiceId === "CUSTOM" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 animate-in fade-in duration-150">
              <input
                type="text"
                placeholder={
                  locale === "ru" ? "Название услуги" : "Ծառայության անվանում"
                }
                value={customServiceName}
                onChange={(e) => setCustomServiceName(e.target.value)}
                className="w-full bg-[#16161c] border border-white/20 hover:border-accent/60 focus:border-accent rounded-xl px-2.5 py-1.5 text-xs font-mono text-white placeholder:text-muted/60"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="500"
                  placeholder={locale === "ru" ? "Цена (֏)" : "Գին (֏)"}
                  value={bookingPrice}
                  onChange={(e) => setBookingPrice(e.target.value)}
                  className="w-full bg-[#16161c] border border-white/20 hover:border-accent/60 focus:border-accent rounded-xl px-2.5 py-1.5 text-xs font-mono text-white placeholder:text-muted/60"
                />
                <span className="text-xs font-mono text-accent">֏</span>
              </div>
            </div>
          )}

          {/* Row 3: Client Name & Phone (COMPLETELY OPTIONAL) */}
          <div className="p-2.5 rounded-xl bg-[#141418] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                {locale === "ru" ? "Клиент (необязательно)" : "Հաճախորդ (ոչ պարտադիր)"}
              </span>
              <span className="text-[9px] font-mono text-emerald-400">
                {locale === "ru" ? "без обязательных полей" : "optional"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={
                  locale === "ru" ? "Имя клиента (например: Армен)" : "Անուն (օր. Արմեն)"
                }
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-[#1b1b22] border border-white/20 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white placeholder:text-muted/50"
              />
              <input
                type="tel"
                placeholder="+374 98 123456"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-[#1b1b22] border border-white/20 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white placeholder:text-muted/50"
              />
            </div>
          </div>

          {/* Modal Action Buttons (Always visible at bottom) */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsManualBookingOpen(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-mono text-muted hover:text-white transition-colors"
            >
              {t.common.cancel}
            </button>

            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmittingBooking}
              className="rounded-xl px-4 py-2 text-xs font-mono font-bold shadow-[0_2px_15px_rgba(197,168,128,0.35)] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>
                {locale === "ru"
                  ? "Записать клиента"
                  : locale === "hy"
                  ? "Գրանցել հաճախորդին"
                  : "Book Client"}
              </span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Open Day / Hour Form */}
      <Modal
        isOpen={isOpenDateModalOpen}
        onClose={() => setIsOpenDateModalOpen(false)}
        title={t.barberCalendar.openHour}
        description={
          locale === "ru"
            ? "Откройте дату и конкретный час. День сразу появится в календаре."
            : locale === "hy"
            ? "Բացեք օրը և կոնկրետ ժամը: Օրը անմիջապես կերևա օրացույցում:"
            : "Open date and specific hour. Date will immediately show in open days."
        }
      >
        <form onSubmit={handleOpenDateSubmit} className="space-y-4 py-1">
          {/* Quick Date Chips + Date input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                {t.barberCalendar.date}
              </label>
              <span className="text-[10px] font-mono text-accent font-semibold">{newOpenDate}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: locale === "ru" ? "Сегодня" : locale === "hy" ? "Այսօր" : "Today", date: getOffsetDate(0) },
                { label: locale === "ru" ? "Завтра" : locale === "hy" ? "Վաղը" : "Tomorrow", date: getOffsetDate(1) },
                { label: locale === "ru" ? "Послезавтра" : locale === "hy" ? "Մյուս օրը" : "In 2 days", date: getOffsetDate(2) },
              ].map((preset) => (
                <button
                  key={preset.date}
                  type="button"
                  onClick={() => setNewOpenDate(preset.date)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all border ${
                    newOpenDate === preset.date
                      ? "bg-accent text-slate-950 border-accent font-bold shadow-[0_0_8px_rgba(197,168,128,0.4)]"
                      : "bg-[#18181f] border-white/15 text-white/70 hover:text-white hover:border-white/30"
                  }`}
                >
                  {preset.label}
                </button>
              ))}

              <input
                type="date"
                value={newOpenDate}
                onChange={(e) => setNewOpenDate(e.target.value)}
                className="flex-1 min-w-[130px] bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-2.5 py-1 text-xs font-mono transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Time Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                {t.barberCalendar.time}
              </label>
              <span className="text-[10px] font-mono text-accent font-semibold">⏰ {newOpenStartTime}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={newOpenStartTime}
                onChange={(e) => setNewOpenStartTime(e.target.value)}
                className="w-full bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono transition-all [color-scheme:dark]"
              >
                {TIME_OPTIONS.map((tVal) => (
                  <option key={tVal} value={tVal}>
                    ⏰ {tVal}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted shrink-0">
                  {locale === "ru" ? "Точный час:" : "Exact hour:"}
                </span>
                <input
                  type="time"
                  value={newOpenStartTime}
                  onChange={(e) => setNewOpenStartTime(e.target.value)}
                  className="flex-1 bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-3 py-1.5 text-xs font-mono transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Duration Dropdown */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                {t.barberCalendar.duration}
              </label>
              <span className="text-[10px] font-mono text-accent font-semibold">{newOpenDuration} мин</span>
            </div>

            <select
              value={newOpenDuration}
              onChange={(e) => setNewOpenDuration(Number(e.target.value))}
              className="w-full bg-[#16161c] border border-white/25 hover:border-accent/60 focus:border-accent focus:ring-1 focus:ring-accent/30 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono transition-all [color-scheme:dark]"
            >
              <option value={30}>30 мин (0.5ч)</option>
              <option value={45}>45 мин (0.75ч)</option>
              <option value={60}>60 мин (1.0ч)</option>
              <option value={75}>75 мин (1.25ч)</option>
              <option value={90}>90 мин (1.5ч)</option>
              <option value={120}>120 мин (2.0ч)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsOpenDateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-mono text-muted hover:text-white transition-colors"
            >
              {t.common.cancel}
            </button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmittingOpenDate}
              className="rounded-xl px-5 py-2.5 text-xs font-mono font-bold shadow-[0_2px_15px_rgba(197,168,128,0.35)] flex items-center gap-2"
            >
              <Unlock className="w-3.5 h-3.5 text-slate-950" />
              <span>{t.barberCalendar.openHour}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
