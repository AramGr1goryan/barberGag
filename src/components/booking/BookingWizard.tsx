"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/timezone";
import { ReturningAppointmentCard, ReturningBookingData } from "./ReturningAppointmentCard";
import { BlockedBookingCard } from "./BlockedBookingCard";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronDown,
  Check,
  Phone,
  User,
  ShieldCheck,
  ArrowRight,
  Download,
} from "lucide-react";

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

export interface AddonItem {
  id: string;
  nameHy: string;
  nameRu: string;
  nameEn: string;
  durationMinutes: number;
  priceMinorUnits: number;
}

export interface BookingWizardProps {
  locale: Locale;
  services: ServiceItem[];
  addons: AddonItem[];
  initialServiceId?: string;
  dict: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    selectDate: string;
    selectTime: string;
    dayClosed: string;
    noSlotsTitle: string;
    noSlotsDesc: string;
    guestName: string;
    guestPhone: string;
    continue: string;
    back: string;
    confirmBooking: string;
    existingAppointmentTitle: string;
    existingAppointmentDesc: string;
    changeAppointment: string;
    cancelAppointment: string;
    smsVerificationTitle: string;
    smsVerificationDesc: string;
    codePlaceholder: string;
    verifyBtn: string;
    verifying: string;
    resendCode: string;
    resendCooldown: string;
    threeHourRuleError: string;
    slotUnavailable: string;
    successTitle: string;
    bookingRef: string;
    addToCalendar: string;
    returnHome: string;
  };
  currentUser?: { name: string; phone: string } | null;
}

export function BookingWizard({
  locale,
  services,
  addons,
  initialServiceId,
  dict,
  currentUser,
}: BookingWizardProps) {
  // Returning visitor state - if active booking exists, ONLY allow reschedule/cancel
  const [activeBooking, setActiveBooking] = useState<ReturningBookingData | null>(null);
  const [blockedData, setBlockedData] = useState<{
    isBlocked: boolean;
    blockedUntil: string;
    remainingSeconds: number;
    cooldownHours: number;
  } | null>(null);
  const [isCheckingActive, setIsCheckingActive] = useState(true);

  // Stepper state:
  // 1: Date, Time & Barber (Bulgakov screen from reference photo)
  // 2: Choose Service & Add-ons
  // 3: Client Details (Name, Phone)
  // 4: SMS Verification (OTP)
  // 5: Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Floating panel state for mobile
  const [isPanelLowered, setIsPanelLowered] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Ref for touch state (no re-renders!)
  const touchState = useRef({
    start: null as number | null,
    offset: 0
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchState.current.start = e.targetTouches[0].clientY;
    touchState.current.offset = 0;
    if (panelRef.current) {
      // Disable transition while dragging for instant response
      panelRef.current.style.transition = "none";
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchState.current.start === null) return;
    const currentY = e.targetTouches[0].clientY;
    let diff = currentY - touchState.current.start;

    // Add some resistance if dragging out of bounds
    if (!isPanelLowered && diff < 0) {
      diff = diff * 0.2; // Resistance when dragging up from top
    } else if (isPanelLowered && diff > 0) {
      diff = diff * 0.2; // Resistance when dragging down from bottom
    }

    touchState.current.offset = diff;
    
    // Apply transform directly to DOM (0 re-renders!)
    if (panelRef.current) {
      panelRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchState.current.start === null) return;
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchEnd - touchState.current.start;

    if (panelRef.current) {
      // Restore transition for smooth snapping
      panelRef.current.style.transition = "all 0.5s cubic-bezier(0.32,0.72,0,1)";
      panelRef.current.style.transform = "translateY(0)";
    }

    if (!isPanelLowered && diff > 60) {
      setIsPanelLowered(true);
    } else if (isPanelLowered && diff < -60) {
      setIsPanelLowered(false);
    }
    
    touchState.current.start = null;
    touchState.current.offset = 0;
  };

  // Selection state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [openDates, setOpenDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ id: string; startTime: string; endTime: string }[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [isDayClosed, setIsDayClosed] = useState<boolean>(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Month navigation offset (0 = current month, 1 = next month, ...)
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // Close month picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false);
      }
    };
    if (showMonthPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMonthPicker]);

  // Service & Addon selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || services[0]?.id || "");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // User input
  const [guestName, setGuestName] = useState<string>(currentUser?.name || "");
  const [guestPhone, setGuestPhone] = useState<string>(currentUser?.phone || "");

  // SMS verification & booking result
  const [createdBookingId, setCreatedBookingId] = useState<string>("");
  const [createdBookingNumber, setCreatedBookingNumber] = useState<string>("");
  const [smsCode, setSmsCode] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // Check returning visitor appointment & cancellation cooldown
  const checkActiveAppointment = async () => {
    try {
      setIsCheckingActive(true);
      const res = await fetch("/api/booking/check-active");
      const data = await res.json();
      if (data.hasActiveBooking) {
        setActiveBooking(data.booking);
        setBlockedData(null);
      } else if (data.isBlocked) {
        setActiveBooking(null);
        setBlockedData({
          isBlocked: true,
          blockedUntil: data.blockedUntil,
          remainingSeconds: data.remainingSeconds || 10800,
          cooldownHours: typeof data.cooldownHours === "number" ? data.cooldownHours : 3,
        });
      } else {
        setActiveBooking(null);
        setBlockedData(null);
      }
    } catch {
      setActiveBooking(null);
      setBlockedData(null);
    } finally {
      setIsCheckingActive(false);
    }
  };

  useEffect(() => {
    checkActiveAppointment();
  }, []);

  // Fetch open dates
  useEffect(() => {
    const fetchOpenDates = async () => {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() + 60);

      const startStr = today.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      try {
        const res = await fetch(`/api/availability/dates?start=${startStr}&end=${endStr}`);
        const data = await res.json();
        if (data.openDates) {
          setOpenDates(data.openDates);
        }
      } catch {
        setOpenDates([]);
      }
    };

    fetchOpenDates();
  }, []);

  // Generate available months list for the month picker (current + next 5 months)
  const availableMonths = useMemo(() => {
    const months: { label: string; offset: number; month: number; year: number }[] = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const label = new Intl.DateTimeFormat(
        locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US",
        { month: "long", year: "numeric" }
      ).format(d);
      months.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        offset: i,
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }
    return months;
  }, [locale]);

  // Generate dates for the selected month (filtered to today onward)
  const datesList = useMemo(() => {
    const list: {
      dateStr: string;
      dayNum: string;
      dayName: string;
      monthName: string;
      year: number;
    }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const targetYear = targetMonth.getFullYear();
    const targetMo = targetMonth.getMonth();
    const daysInMonth = new Date(targetYear, targetMo + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(targetYear, targetMo, day);
      // Skip past dates
      if (d < today) continue;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dayStr = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${dayStr}`;
      const dayNum = dayStr;
      const dayName = new Intl.DateTimeFormat(
        locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US",
        { weekday: "short" }
      )
        .format(d)
        .replace(".", "")
        .toUpperCase();
      const monthName = new Intl.DateTimeFormat(
        locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US",
        { month: "long" }
      ).format(d);

      list.push({ dateStr, dayNum, dayName, monthName, year });
    }
    return list;
  }, [locale, monthOffset]);

  // Automatically select first date when month changes or on init
  useEffect(() => {
    if (datesList.length > 0) {
      const isSelectedDateInCurrentMonth = selectedDate && datesList.some((dl) => dl.dateStr === selectedDate);
      if (!isSelectedDateInCurrentMonth) {
        const firstOpen = openDates.length > 0
          ? openDates.find((od) => datesList.some((dl) => dl.dateStr === od)) || datesList[0].dateStr
          : datesList[0].dateStr;
        setSelectedDate(firstOpen);
      }
    }
  }, [datesList, openDates, selectedDate]);

  // Fetch slots for selected date
  useEffect(() => {
    if (!selectedDate) return;
    const fetchSlots = async () => {
      setSelectedSlotId("");
      setIsLoadingSlots(true);
      try {
        const res = await fetch(`/api/availability/slots?date=${selectedDate}`);
        const data = await res.json();
        if (data.isOpen && data.slots && data.slots.length > 0) {
          setIsDayClosed(false);
          setAvailableSlots(data.slots);
          setSelectedSlotId(data.slots[0].id);
        } else {
          setIsDayClosed(true);
          setAvailableSlots([]);
        }
      } catch {
        setIsDayClosed(true);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  // SMS cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Calculations
  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];
  const selectedAddonsList = addons.filter((a) => selectedAddonIds.includes(a.id));
  const totalDuration =
    (selectedService?.durationMinutes || 0) +
    selectedAddonsList.reduce((acc, a) => acc + a.durationMinutes, 0);
  const totalPrice =
    (selectedService?.priceMinorUnits || 0) +
    selectedAddonsList.reduce((acc, a) => acc + a.priceMinorUnits, 0);

  const getServiceName = (s?: ServiceItem) => {
    if (!s) return "";
    return locale === "ru" ? s.nameRu : locale === "en" ? s.nameEn : s.nameHy;
  };
  const getServiceDesc = (s?: ServiceItem) => {
    if (!s) return "";
    return locale === "ru" ? s.descriptionRu : locale === "en" ? s.descriptionEn : s.descriptionHy;
  };
  const getAddonName = (a: AddonItem) =>
    locale === "ru" ? a.nameRu : locale === "en" ? a.nameEn : a.nameHy;

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Month & Year header title e.g. "September 2026"
  const currentMonthYear = useMemo(() => {
    const today = new Date();
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const month = new Intl.DateTimeFormat(
      locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US",
      { month: "long" }
    ).format(d);
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    const year = d.getFullYear();
    return locale === "hy" ? `${year} թ․ ${capitalizedMonth}` : `${capitalizedMonth} ${year}`;
  }, [monthOffset, locale]);

  const selectedSlot = availableSlots.find((s) => s.id === selectedSlotId);

  // Master barber name for display (hardcoded owner)
  const masterBarberName = locale === "ru" ? "Гагик Гамбарян" : locale === "hy" ? "Գագիկ Ղամբարյան" : "Gagik Ghambaryan";

  // Submit booking & request SMS OTP
  const handleInitiateBooking = async () => {
    if (!selectedServiceId || !selectedDate || !selectedSlotId || !guestName || !guestPhone) {
      setErrorMessage(
        locale === "ru"
          ? "Пожалуйста, заполните все обязательные поля."
          : locale === "hy"
          ? "Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը:"
          : "Please fill all required fields."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/booking/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          addonIds: selectedAddonIds,
          date: selectedDate,
          slotId: selectedSlotId,
          guestName,
          guestPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "ACTIVE_BOOKING_EXISTS" || data.error === "THREE_HOUR_RESTRICTION") {
          throw new Error(data.message || dict.threeHourRuleError);
        }
        if (data.error === "SLOT_ALREADY_RESERVED") {
          throw new Error(dict.slotUnavailable);
        }
        throw new Error(data.message || data.error || "Booking failed");
      }

      setCreatedBookingId(data.bookingId);
      setCreatedBookingNumber(data.bookingNumber);
      setResendCooldown(60);
      setCurrentStep(4); // Move to SMS verification
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error initiating booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify SMS OTP
  const handleVerifySms = async () => {
    if (smsCode.length !== 6 || isRedirecting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: createdBookingId,
          code: smsCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (typeof data.attemptsLeft === "number") {
          setAttemptsLeft(data.attemptsLeft);
        }

        if (
          data.redirectToHome ||
          data.status === "MAX_ATTEMPTS_EXCEEDED" ||
          (typeof data.attemptsLeft === "number" && data.attemptsLeft <= 0)
        ) {
          setIsRedirecting(true);
          setErrorMessage(
            locale === "ru"
              ? "3 раза введен неверный код. Запись отменена. Перенаправление..."
              : locale === "hy"
              ? "3 անգամ սխալ կոդ եք մուտքագրել: Գրանցումը չեղարկված է:"
              : "3 incorrect attempts. Booking cancelled. Redirecting..."
          );
          setTimeout(() => {
            window.location.href = `/${locale}`;
          }, 2200);
          return;
        }

        throw new Error(data.error || "Invalid verification code");
      }

      setCurrentStep(5); // Success confirmation
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend SMS
  const handleResendSms = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await fetch("/api/booking/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: createdBookingId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend SMS");
      }
      setResendCooldown(data.resendAvailableInSeconds || 60);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error resending");
    }
  };

  // Download .ics Calendar event
  const handleDownloadIcs = () => {
    const startHour = selectedSlot?.startTime || "10:00";
    const endHour = selectedSlot?.endTime || "11:00";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Gagik Ghambaryan Barbershop//NONSGML v1.0//EN",
      "BEGIN:VEVENT",
      `SUMMARY:Appointment with Master Barber Gagik Ghambaryan`,
      `DESCRIPTION:${getServiceName(selectedService)} (Ref: ${createdBookingNumber})`,
      `LOCATION:19 Bagratunyats St, Yerevan`,
      `DTSTART:${selectedDate.replace(/-/g, "")}T${startHour.replace(/:/g, "")}00`,
      `DTEND:${selectedDate.replace(/-/g, "")}T${endHour.replace(/:/g, "")}00`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `appointment-${createdBookingNumber}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Blocked due to cancellation cooldown
  if (!isCheckingActive && blockedData?.isBlocked) {
    return (
      <div className="max-w-md sm:max-w-lg mx-auto pt-16 px-4">
        <BlockedBookingCard
          locale={locale}
          blockedUntil={blockedData.blockedUntil}
          initialSeconds={blockedData.remainingSeconds}
          cooldownHours={blockedData.cooldownHours}
        />
      </div>
    );
  }

  // Returning visitor active appointment
  if (!isCheckingActive && activeBooking) {
    return (
      <div className="max-w-md sm:max-w-lg mx-auto pt-16 px-4">
        <ReturningAppointmentCard
          locale={locale}
          booking={activeBooking}
          dict={{
            existingAppointmentTitle: dict.existingAppointmentTitle,
            existingAppointmentDesc: dict.existingAppointmentDesc,
            changeAppointment: dict.changeAppointment,
            cancelAppointment: dict.cancelAppointment,
            bookingRef: dict.bookingRef,
            duration: "min",
          }}
          onRescheduleSuccess={() => checkActiveAppointment()}
          onCancelSuccess={() => checkActiveAppointment()}
        />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto min-h-screen lg:min-h-[calc(100vh-96px)] flex flex-col lg:flex-row relative bg-[#14151a] overflow-x-clip">
      {/* 
        TOP CINEMATIC HERO SECTION
        Barbershop interior background image + Golden brand logo + Back chevron
      */}
      {/* TOP CINEMATIC HERO SECTION — full width on mobile, left half on desktop */}
      <div 
        className="sticky top-0 h-[75vh] sm:h-[80vh] lg:h-full lg:sticky lg:top-0 lg:w-[45%] w-full shrink-0 overflow-hidden select-none z-0"
        onClick={() => setIsPanelLowered(false)}
      >
        <Image
          src="/images/gagik-barber.jpg"
          alt="Gagik Ghambaryan Portrait"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-[center_top] filter brightness-[0.85] contrast-[1.05]"
        />

        {/* Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14151a] via-[#14151a]/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#14151a] pointer-events-none" />

        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 pt-24 px-5 flex items-start justify-between">
          {/* Back Chevron */}
          {currentStep === 1 ? (
            <Link
              href={`/${locale}`}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 active:scale-95 transition-all shadow-lg"
              aria-label="Back to Home"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 active:scale-95 transition-all shadow-lg cursor-pointer"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>
          )}
        </div>

        {/* Desktop: centered branding at bottom */}
        <div className="hidden lg:flex absolute bottom-10 left-0 right-0 z-20 flex-col items-center gap-2">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#c5a880]/50 to-transparent" />
          <span className="text-[10px] font-mono tracking-[0.3em] text-[#c5a880]/60 uppercase">
            {locale === "ru" ? "Премиум бронирование" : locale === "hy" ? "Պրեմիում ամրագրում" : "Premium Booking"}
          </span>
        </div>
      </div>

      {/* 
        FLOATING BOTTOM SHEET / LUXURY CARD
        Rounded top corners overlapping the photo with exact Bulgakov UI styling
      */}
      {/* FLOATING BOTTOM SHEET — full width on mobile, right 55% on desktop */}
      <div 
        ref={panelRef}
        className={`relative z-20 min-h-[90vh] lg:min-h-0 rounded-t-[40px] lg:rounded-none bg-[#14151a] border-t lg:border-t-0 lg:border-l border-white/[0.08] shadow-[0_-25px_60px_rgba(0,0,0,0.95)] lg:shadow-none px-5 sm:px-6 lg:px-10 pt-8 lg:pt-10 pb-10 flex-1 flex flex-col justify-between lg:w-[55%] lg:overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isPanelLowered 
            ? "mt-[-5vh] sm:mt-[-10vh] lg:mt-0" 
            : "mt-[calc(-30vh-3rem)] sm:mt-[calc(-30vh-4rem)] lg:mt-0"
        }`}
      >
        {/* Mobile Drag Handle */}
        <div 
          className="absolute top-0 left-0 right-0 h-14 flex justify-center items-center lg:hidden cursor-pointer z-30 touch-none"
          onClick={() => setIsPanelLowered(!isPanelLowered)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full transition-colors hover:bg-white/40 active:bg-white/50" />
        </div>
        {/* ================= STEP 1: DATE & TIME ================= */}
        {currentStep === 1 && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Month & Year Title with Calendar Picker */}
              <div className="flex items-center justify-between mb-6 select-none relative" ref={monthPickerRef}>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  {currentMonthYear}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowMonthPicker((prev) => !prev)}
                  className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#c5a880] hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  aria-label="Select month"
                >
                  <CalendarIcon className="w-5 h-5" />
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMonthPicker ? "rotate-180" : ""}`} />
                </button>

                {/* Month Picker Dropdown */}
                {showMonthPicker && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-56 py-2 rounded-2xl bg-[#1a1c24] border border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {availableMonths.map((m) => (
                      <button
                        key={m.offset}
                        type="button"
                        onClick={() => {
                          setMonthOffset(m.offset);
                          setShowMonthPicker(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-all cursor-pointer ${
                          monthOffset === m.offset
                            ? "bg-white/10 text-white font-bold"
                            : "text-neutral-300 hover:bg-white/[0.05] hover:text-white"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* DATE SECTION */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 font-semibold uppercase select-none">
                  {locale === "ru" ? "ДАТА" : locale === "hy" ? "ԱՄՍԱԹԻՎ" : "DATE"}
                </div>
                <div className="flex gap-2.5 overflow-x-auto lg:flex-wrap pb-2 pt-1 scrollbar-none select-none -mx-1 px-1">
                  {datesList.map((item) => {
                    const isSelected = selectedDate === item.dateStr;
                    return (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`min-w-[62px] h-[72px] lg:min-w-[68px] lg:h-[78px] rounded-2xl flex flex-col items-center justify-center transition-all duration-200 shrink-0 lg:shrink select-none cursor-pointer ${
                          isSelected
                            ? "bg-white text-black shadow-[0_8px_25px_rgba(255,255,255,0.25)] scale-[1.03]"
                            : "bg-[#20222a] text-white hover:bg-[#282a34] border border-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`text-xl lg:text-2xl font-bold font-sans tracking-tight leading-none ${
                            isSelected ? "text-black" : "text-white"
                          }`}
                        >
                          {item.dayNum}
                        </span>
                        <span
                          className={`text-[10px] font-bold tracking-wider uppercase mt-1.5 ${
                            isSelected ? "text-neutral-800" : "text-neutral-400"
                          }`}
                        >
                          {item.dayName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TIME SECTION */}
              <div className="space-y-2.5 mt-6">
                <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 font-semibold uppercase select-none">
                  {locale === "ru" ? "ВРЕМЯ" : locale === "hy" ? "ԺԱՄ" : "TIME"}
                </div>

                {isLoadingSlots ? (
                  <div className="grid grid-cols-4 gap-2 sm:gap-2.5 py-2 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div
                        key={i}
                        className="h-11 w-full rounded-2xl bg-white/[0.05] animate-pulse"
                      />
                    ))}
                  </div>
                ) : isDayClosed || availableSlots.length === 0 ? (
                  <div className="py-4 px-4 rounded-2xl bg-[#20222a] border border-white/[0.06] text-center">
                    <p className="text-xs text-neutral-300 font-medium">
                      {locale === "ru"
                        ? "На выбранную дату нет свободных часов. Выберите другой день."
                        : locale === "hy"
                        ? "Նշված օրվա համար ազատ ժամեր չկան: Խնդրում ենք ընտրել այլ օր:"
                        : "No available slots for this date. Please pick another day."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:gap-2.5 max-h-[30vh] sm:max-h-[35vh] lg:max-h-[40vh] overflow-y-auto overflow-x-hidden pb-2 pt-1 scrollbar-none select-none -mx-1 px-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wider transition-all duration-200 select-none cursor-pointer flex items-center justify-center touch-manipulation ${
                            isSelected
                              ? "bg-white text-black shadow-[0_8px_25px_rgba(255,255,255,0.22)] scale-[1.03] z-10"
                              : "bg-[#20222a] text-white hover:bg-[#282a34] border border-white/[0.04]"
                          }`}
                        >
                          {slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* ACTION BUTTON: "Choose a service" */}
            <div className="mt-8 pt-2 select-none">
              <button
                type="button"
                disabled={!selectedDate || !selectedSlotId}
                onClick={() => setCurrentStep(2)}
                className="w-full py-4 px-6 rounded-full bg-white text-black font-serif font-bold text-base hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 shadow-[0_12px_35px_rgba(0,0,0,0.6)] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              >
                <span>
                  {locale === "ru"
                    ? "Выбрать услугу"
                    : locale === "hy"
                    ? "Ընտրել ծառայությունը"
                    : "Choose a service"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: CHOOSE SERVICE & ADD-ONS ================= */}
        {currentStep === 2 && (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Selected Date & Time Pill Header */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs font-mono">
                <span className="text-[#c5a880] font-semibold">
                  📅 {selectedDate} • ⏰ {selectedSlot?.startTime}
                </span>
                <span className="text-neutral-400 truncate max-w-[140px]">
                  ✂️ {masterBarberName}
                </span>
              </div>

              {/* Primary Services */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 font-semibold uppercase">
                  {locale === "ru"
                    ? "ОСНОВНАЯ УСЛУГА"
                    : locale === "hy"
                    ? "ՀԻՄՆԱԿԱՆ ԾԱՌԱՅՈՒԹՅՈՒՆ"
                    : "PRIMARY SERVICE"}
                </div>
                <div className="space-y-2.5">
                  {services.map((s) => {
                    const isSelected = selectedServiceId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedServiceId(s.id)}
                        className={`p-4 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                          isSelected
                            ? "bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)] ring-2 ring-white"
                            : "bg-[#20222a] text-white hover:bg-[#282a34] border border-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4
                              className={`font-serif font-bold text-sm sm:text-base ${
                                isSelected ? "text-black" : "text-white"
                              }`}
                            >
                              {getServiceName(s)}
                            </h4>
                            <p
                              className={`text-xs mt-1 leading-relaxed ${
                                isSelected ? "text-neutral-700" : "text-neutral-400"
                              }`}
                            >
                              {getServiceDesc(s)}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between text-xs font-mono">
                          <span className={isSelected ? "text-neutral-600" : "text-neutral-400"}>
                            {s.durationMinutes} {locale === "hy" ? "րոպե" : "мин"}
                          </span>
                          <span
                            className={`font-bold ${
                              isSelected ? "text-black text-sm" : "text-[#c5a880] text-sm"
                            }`}
                          >
                            {formatCurrency(s.priceMinorUnits, locale)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhancing Add-ons */}
              {addons.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 font-semibold uppercase">
                    {locale === "ru"
                      ? "ДОПОЛНИТЕЛЬНЫЙ УХОД"
                      : locale === "hy"
                      ? "ԼՐԱՑՈՒՑԻՉ ԽՆԱՄՔ"
                      : "ADD-ONS & TREATMENTS"}
                  </div>
                  <div className="space-y-2">
                    {addons.map((a) => {
                      const isSelected = selectedAddonIds.includes(a.id);
                      return (
                        <div
                          key={a.id}
                          onClick={() => toggleAddon(a.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs select-none ${
                            isSelected
                              ? "bg-white text-black border-white shadow-md font-medium"
                              : "bg-[#20222a] text-white border-white/[0.04] hover:bg-[#282a34]"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-black border-black text-white"
                                  : "border-white/20 bg-white/[0.03]"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>{getAddonName(a)}</span>
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              isSelected ? "text-black" : "text-[#c5a880]"
                            }`}
                          >
                            +{formatCurrency(a.priceMinorUnits, locale)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Total Summary & Button */}
            <div className="pt-4 border-t border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">
                  {locale === "ru" ? "Итого:" : locale === "hy" ? "Ընդհանուր՝" : "Total:"} (
                  {totalDuration} {locale === "hy" ? "ր" : "min"})
                </span>
                <span className="text-[#c5a880] font-bold text-base">
                  {formatCurrency(totalPrice, locale)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-full py-4 px-6 rounded-full bg-white text-black font-serif font-bold text-base hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 shadow-[0_12px_35px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {locale === "ru"
                    ? "Продолжить к данным"
                    : locale === "hy"
                    ? "Լրացնել տվյալները"
                    : "Continue to Details"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CLIENT DETAILS ================= */}
        {currentStep === 3 && (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Detailed Summary Card */}
              <div className="p-4 rounded-2xl bg-[#20222a] border border-white/[0.06] space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "Услуга:" : locale === "hy" ? "Ծառայություն՝" : "Service:"}
                  </span>
                  <span className="text-white font-semibold">
                    {getServiceName(selectedService)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "Мастер:" : locale === "hy" ? "Վարպետ՝" : "Master:"}
                  </span>
                  <span className="text-[#c5a880] font-semibold">{masterBarberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "Дата и время:" : locale === "hy" ? "Օր և Ժամ՝" : "Date & Time:"}
                  </span>
                  <span className="text-white font-semibold">
                    {selectedDate} • {selectedSlot?.startTime}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "Итого к оплате:" : locale === "hy" ? "Գումար՝" : "Total Price:"}
                  </span>
                  <span className="text-[#c5a880] font-bold text-sm">
                    {formatCurrency(totalPrice, locale)}
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono tracking-wider text-neutral-300 font-semibold uppercase mb-1.5">
                    {dict.guestName} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Արամ Սարգսյան"
                      className="w-full bg-[#20222a] border border-white/[0.08] focus:border-white focus:ring-1 focus:ring-white rounded-2xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono tracking-wider text-neutral-300 font-semibold uppercase mb-1.5">
                    {dict.guestPhone} *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+374 91 000000"
                      className="w-full bg-[#20222a] border border-white/[0.08] focus:border-white focus:ring-1 focus:ring-white rounded-2xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880]" />
                    <span>
                      {locale === "ru"
                        ? "Код подтверждения будет отправлен по SMS на этот номер"
                        : locale === "hy"
                        ? "Հաստատման կոդն ուղարկվելու է նշված համարին (SMS)"
                        : "Verification code will be sent via SMS to this number"}
                    </span>
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Confirm & Verify Button */}
            <div className="pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                disabled={isSubmitting || !guestName.trim() || !guestPhone.trim()}
                onClick={handleInitiateBooking}
                className="w-full py-4 px-6 rounded-full bg-white text-black font-serif font-bold text-base hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 shadow-[0_12px_35px_rgba(0,0,0,0.6)] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>{dict.verifying}</span>
                ) : (
                  <>
                    <span>{dict.confirmBooking}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: SMS OTP VERIFICATION ================= */}
        {currentStep === 4 && (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#c5a880] mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {dict.smsVerificationTitle}
                </h3>
                <p className="text-xs text-neutral-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  {locale === "ru"
                    ? `Введите 6-значный проверочный код, отправленный на номер ${guestPhone}`
                    : locale === "hy"
                    ? `Մուտքագրեք 6-նիշ հաստատման կոդը, որն ուղարկվել է ${guestPhone} համարին`
                    : `Enter the 6-digit code sent to ${guestPhone}`}
                </p>
              </div>

              {/* 6-digit code input */}
              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  maxLength={6}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.4em] font-mono text-2xl py-3.5 rounded-2xl bg-[#20222a] border border-white/10 focus:border-white focus:ring-1 focus:ring-white text-white focus:outline-none transition-all"
                />
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              {/* Resend link */}
              <div>
                {resendCooldown > 0 ? (
                  <span className="text-xs font-mono text-neutral-500">
                    {dict.resendCooldown.replace("{seconds}", String(resendCooldown))}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendSms}
                    className="text-xs font-mono text-[#c5a880] hover:underline cursor-pointer"
                  >
                    {dict.resendCode}
                  </button>
                )}
              </div>
            </div>

            {/* Verify Code Button */}
            <div className="pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                disabled={isSubmitting || smsCode.length !== 6 || isRedirecting}
                onClick={handleVerifySms}
                className="w-full py-4 px-6 rounded-full bg-white text-black font-serif font-bold text-base hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 shadow-[0_12px_35px_rgba(0,0,0,0.6)] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>{dict.verifying}</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{dict.verifyBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: CONFIRMATION SUCCESS ================= */}
        {currentStep === 5 && (
          <div className="flex-1 flex flex-col justify-between space-y-6 text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
                  {dict.successTitle}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 font-mono">
                  {dict.bookingRef}:{" "}
                  <span className="text-[#c5a880] font-bold">{createdBookingNumber}</span>
                </p>
              </div>

              {/* Receipt card */}
              <div className="p-5 rounded-2xl bg-[#20222a] border border-white/[0.06] space-y-2.5 text-xs font-mono text-left">
                <div className="flex justify-between">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "Гость:" : locale === "hy" ? "Հյուր՝" : "Guest:"}
                  </span>
                  <span className="text-white font-semibold">{guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "Мастер:" : locale === "hy" ? "Վարպետ՝" : "Master:"}
                  </span>
                  <span className="text-[#c5a880] font-semibold">{masterBarberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "Услуга:" : locale === "hy" ? "Ծառայություն՝" : "Service:"}
                  </span>
                  <span className="text-white font-semibold">{getServiceName(selectedService)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "Дата и время:" : locale === "hy" ? "Օր և Ժամ՝" : "Date & Time:"}
                  </span>
                  <span className="text-white font-semibold">
                    {selectedDate} • {selectedSlot?.startTime}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "К оплате в салоне:" : locale === "hy" ? "Գումար՝" : "Total Price:"}
                  </span>
                  <span className="text-[#c5a880] font-bold text-sm">
                    {formatCurrency(totalPrice, locale)}
                  </span>
                </div>
                <div className="pt-2 text-[10px] text-neutral-500 text-center">
                  📍 ք. Երևան, Բագրատունյաց 19 (19 Bagratunyats St, Yerevan)
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="w-full py-4 px-6 rounded-full bg-white text-black font-serif font-bold text-base hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 shadow-[0_12px_35px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{dict.addToCalendar}</span>
              </button>

              <Link
                href={`/${locale}`}
                className="block w-full py-3 px-6 rounded-full bg-white/[0.05] border border-white/10 text-white font-serif font-medium text-sm hover:bg-white/10 transition-all text-center"
              >
                {dict.returnHome}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
