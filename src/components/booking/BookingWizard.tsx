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
  X,
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
  currentUser?: { name: string; phone: string; email?: string } | null;
  onClose?: () => void;
}

export function BookingWizard({
  locale,
  services,
  addons,
  initialServiceId,
  dict,
  currentUser,
  onClose,
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

  const panelRef = useRef<HTMLDivElement>(null);


  // Selection state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [openDates, setOpenDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ id: string; startTime: string; endTime: string }[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [isDayClosed, setIsDayClosed] = useState<boolean>(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [showMorning, setShowMorning] = useState<boolean>(true);
  const [showAfternoon, setShowAfternoon] = useState<boolean>(true);
  const [showEvening, setShowEvening] = useState<boolean>(true);

  // Month navigation offset (0 = current month, 1 = next month, ...)
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // Close month picker is now handled by a full-screen overlay in JSX

  // Service & Addon selections
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(initialServiceId ? [initialServiceId] : (services.length > 0 ? [services[0].id] : []));
  

  // User input
  const [guestName, setGuestName] = useState<string>(currentUser?.name || "");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [guestRealPhone, setGuestRealPhone] = useState<string>("");

  // SMS verification & booking result
  const [createdBookingId, setCreatedBookingId] = useState<string>("");
  const [createdBookingNumber, setCreatedBookingNumber] = useState<string>("");
  const [smsCode, setSmsCode] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // Calculations
  const selectedServicesList = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServicesList.reduce((acc, s) => acc + s.durationMinutes, 0) || 15;
  const totalPrice = selectedServicesList.reduce((acc, s) => acc + s.priceMinorUnits, 0);

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
        const res = await fetch(`/api/availability/dates?start=${startStr}&end=${endStr}&duration=${totalDuration}`);
        const data = await res.json();
        if (data.openDates) {
          setOpenDates(data.openDates);
        }
      } catch {
        setOpenDates([]);
      }
    };

    fetchOpenDates();
  }, [totalDuration]);

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
        const res = await fetch(`/api/availability/slots?date=${selectedDate}&duration=${totalDuration}`);
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
  }, [selectedDate, totalDuration]);

  // SMS cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);



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

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
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
    if (selectedServiceIds.length === 0 || !selectedDate || !selectedSlotId || !guestName || !guestPhone) {
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
          serviceIds: selectedServiceIds,
          date: selectedDate,
          slotId: selectedSlotId,
          guestName,
          guestPhone,
          guestRealPhone,
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
    if (smsCode.length !== 4 || isRedirecting) return;

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
      `DESCRIPTION:${getServiceName(selectedServicesList[0])} (Ref: ${createdBookingNumber})`,
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



  return (
    <div className="w-full mx-auto h-[100dvh] flex flex-col lg:flex-row relative bg-[#14151a] overflow-hidden">
      {/* 
        TOP CINEMATIC HERO SECTION
        Barbershop interior background image + Golden brand logo + Back chevron
      */}
      {/* TOP CINEMATIC HERO SECTION — full width on mobile, left half on desktop */}
      <div
        className="h-[20dvh] lg:h-[100dvh] lg:w-[45%] w-full shrink-0 overflow-hidden select-none z-0 relative"
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

        {/* Desktop: centered branding at bottom */}
        <div className="hidden lg:flex absolute bottom-10 left-0 right-0 z-20 flex-col items-center gap-2">
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#cbd5e1]/50 to-transparent" />
          <span className="text-[10px] font-mono tracking-[0.3em] text-[#cbd5e1]/60 uppercase">
            {locale === "ru" ? "Премиум бронирование" : locale === "hy" ? "Պրեմիում ամրագրում" : "Premium Booking"}
          </span>
        </div>
      </div>

      
      {/* GLOBAL HEADER FOR BOOKING WIZARD */}
      <div className="absolute top-0 left-0 right-0 lg:left-[45%] h-[4.5rem] z-[100] flex items-center justify-between px-5 lg:px-10 pointer-events-none drop-shadow-md">
        <div className="w-12 flex justify-start pointer-events-auto">
          {(currentStep > 1 && currentStep < 5) && (
            <button type="button" onClick={() => setCurrentStep(currentStep - 1)} className="p-2 -ml-2 text-white/90 hover:text-white transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="flex-1 flex justify-center items-center gap-2 select-none relative pointer-events-auto" ref={monthPickerRef}>
          {currentStep === 2 ? (
            <>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide truncate max-w-[200px]">
                {currentMonthYear}
              </h2>
              <button
                type="button"
                onClick={() => setShowMonthPicker((prev) => !prev)}
                className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#cbd5e1] hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
              {/* Dropdown */}
              {showMonthPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} onTouchStart={() => setShowMonthPicker(false)} />
                  <div className="absolute top-full mt-2 z-50 w-56 py-2 rounded-2xl bg-[#14151a]/95 border border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {availableMonths.map((m) => (
                    <button
                      key={m.offset}
                      type="button"
                      onClick={() => {
                        setMonthOffset(m.offset);
                        setShowMonthPicker(false);
                      }}
                      className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors border-l-2 ${
                        m.offset === monthOffset
                          ? "border-[#cbd5e1] bg-white/[0.05] text-white"
                          : "border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.02]"
                      }`}
                    >
                      {m.label}
                    </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : currentStep === 1 ? (
            <h2 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide truncate max-w-[200px]">
              {locale === "ru" ? "Услуги" : locale === "hy" ? "Ծառայություններ" : "Services"}
            </h2>
          ) : currentStep === 3 ? (
            <h2 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide truncate max-w-[200px]">
              {locale === "ru" ? "Детали" : locale === "hy" ? "Տվյալներ" : "Details"}
            </h2>
          ) : currentStep === 4 ? (
             <h2 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide truncate max-w-[200px]">
               OTP
             </h2>
          ) : null}
        </div>

        <div className="w-12 flex justify-end pointer-events-auto">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 text-white/90 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          ) : (
            <Link
              href={`/${locale}`}
              className="p-2 -mr-2 text-white/90 hover:text-white transition-colors block"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>

      {/* FLOATING BOTTOM SHEET — full width on mobile, right 55% on desktop */}
      <div
        ref={panelRef}
        className={`will-change-transform transform-gpu relative z-30 rounded-t-[40px] lg:rounded-none bg-[#14151a]/85 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-white/[0.08] shadow-[0_-10px_40px_rgba(0,0,0,0.45)] lg:shadow-none px-5 sm:px-6 lg:px-10 pt-6 lg:pt-24 pb-10 flex-1 flex flex-col justify-between lg:w-[55%] overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] mt-[calc(-20dvh+4.5rem)] lg:mt-0`}
      >
        {(!isCheckingActive && blockedData?.isBlocked) && (
          <div className="flex-1">
            <BlockedBookingCard
              locale={locale}
              blockedUntil={blockedData.blockedUntil}
              initialSeconds={blockedData.remainingSeconds}
              cooldownHours={blockedData.cooldownHours}
            />
          </div>
        )}

        {(!isCheckingActive && activeBooking && !blockedData?.isBlocked) && (
          <div className="flex-1">
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
        )}

        {(!activeBooking && !blockedData?.isBlocked && currentStep === 2) && (
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
                  className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#cbd5e1] hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  aria-label="Select month"
                >
                  <CalendarIcon className="w-5 h-5" />
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showMonthPicker ? "rotate-180" : ""}`} />
                </button>

                {/* Month Picker Dropdown */}
                {showMonthPicker && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMonthPicker(false)}
                      onTouchStart={() => setShowMonthPicker(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 w-56 py-2 rounded-2xl bg-[#14151a]/80 border border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                      {availableMonths.map((m) => (
                      <button
                        key={m.offset}
                        type="button"
                        onClick={() => {
                          setMonthOffset(m.offset);
                          setShowMonthPicker(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-all cursor-pointer ${monthOffset === m.offset
                            ? "bg-white/10 text-white font-bold"
                            : "text-neutral-300 hover:bg-white/[0.05] hover:text-white"
                          }`}
                      >
                        {m.label}
                      </button>
                    ))}
                    </div>
                  </>
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
                        className={`min-w-[48px] h-[56px] rounded-[12px] flex flex-col items-center justify-center transition-all duration-200 shrink-0 select-none cursor-pointer border ${isSelected
                            ? "bg-[#cbd5e1]/[0.12] text-white border-[#cbd5e1]/70 backdrop-blur-xl scale-[1.03]"
                            : "bg-white/[0.04] backdrop-blur-xl text-white hover:bg-white/[0.08] border-white/[0.08]"
                          }`}
                      >
                        <span
                          className={`text-lg font-bold font-sans tracking-tight leading-none ${isSelected ? "text-[#cbd5e1]" : "text-white"
                            }`}
                        >
                          {item.dayNum}
                        </span>
                        <span
                          className={`text-[9px] font-bold tracking-wider uppercase mt-1 ${isSelected ? "text-neutral-300" : "text-neutral-400"
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
              <div className="space-y-4 mt-6">
                <div className="text-[10px] font-mono tracking-[0.25em] text-neutral-400 font-semibold uppercase select-none">
                  {locale === "ru" ? "ВРЕМЯ" : locale === "hy" ? "ԺԱՄ" : "TIME"}
                </div>

                {isLoadingSlots ? (
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5 py-2 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div
                        key={i}
                        className="h-11 w-full rounded-2xl bg-white/[0.05] animate-pulse"
                      />
                    ))}
                  </div>
                ) : isDayClosed || availableSlots.length === 0 ? (
                  <div className="py-4 px-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] text-center">
                    <p className="text-xs text-neutral-300 font-medium">
                      {locale === "ru"
                        ? "На выбранную дату нет свободных часов. Выберите другой день."
                        : locale === "hy"
                          ? "Նշված օրվա համար ազատ ժամեր չկան: Խնդրում ենք ընտրել այլ օր:"
                          : "No available slots for this date. Please pick another day."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-4 select-none">
                    {/* Morning */}
                    {availableSlots.some(s => s.startTime < "12:00") && (
                      <div className="space-y-2">
                        <button type="button" onClick={() => setShowMorning(!showMorning)} className="flex items-center justify-between w-full py-1 text-xs text-neutral-400 font-semibold tracking-wider">
                          <span>{locale === "ru" ? "УТРО" : locale === "hy" ? "ԱՌԱՎՈՏ" : "MORNING"}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${showMorning ? "rotate-180" : ""}`} />
                        </button>
                        {showMorning && (
                          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                            {availableSlots.filter(s => s.startTime < "12:00").map(slot => {
                              const isSelected = selectedSlotId === slot.id;
                              return (
                                <button key={slot.id} type="button" onClick={() => setSelectedSlotId(slot.id)} className={`w-full py-2 rounded-[10px] text-[13px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center border ${isSelected ? "bg-[#cbd5e1]/[0.12] text-white border-[#cbd5e1]/70 backdrop-blur-xl scale-[1.03]" : "bg-white/[0.04] backdrop-blur-xl text-white hover:bg-white/[0.08] border-white/[0.08]"}`}>
                                  {slot.startTime}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Afternoon */}
                    {availableSlots.some(s => s.startTime >= "12:00" && s.startTime < "17:00") && (
                      <div className="space-y-2">
                        <button type="button" onClick={() => setShowAfternoon(!showAfternoon)} className="flex items-center justify-between w-full py-1 text-xs text-neutral-400 font-semibold tracking-wider">
                          <span>{locale === "ru" ? "ДЕНЬ" : locale === "hy" ? "ԿԵՍՕՐ" : "AFTERNOON"}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${showAfternoon ? "rotate-180" : ""}`} />
                        </button>
                        {showAfternoon && (
                          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                            {availableSlots.filter(s => s.startTime >= "12:00" && s.startTime < "17:00").map(slot => {
                              const isSelected = selectedSlotId === slot.id;
                              return (
                                <button key={slot.id} type="button" onClick={() => setSelectedSlotId(slot.id)} className={`w-full py-2 rounded-[10px] text-[13px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center border ${isSelected ? "bg-[#cbd5e1]/[0.12] text-white border-[#cbd5e1]/70 backdrop-blur-xl scale-[1.03]" : "bg-white/[0.04] backdrop-blur-xl text-white hover:bg-white/[0.08] border-white/[0.08]"}`}>
                                  {slot.startTime}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Evening */}
                    {availableSlots.some(s => s.startTime >= "17:00") && (
                      <div className="space-y-2">
                        <button type="button" onClick={() => setShowEvening(!showEvening)} className="flex items-center justify-between w-full py-1 text-xs text-neutral-400 font-semibold tracking-wider">
                          <span>{locale === "ru" ? "ВЕЧЕР" : locale === "hy" ? "ԵՐԵԿՈ" : "EVENING"}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${showEvening ? "rotate-180" : ""}`} />
                        </button>
                        {showEvening && (
                          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                            {availableSlots.filter(s => s.startTime >= "17:00").map(slot => {
                              const isSelected = selectedSlotId === slot.id;
                              return (
                                <button key={slot.id} type="button" onClick={() => setSelectedSlotId(slot.id)} className={`w-full py-2 rounded-[10px] text-[13px] font-bold tracking-wider transition-all duration-200 flex items-center justify-center border ${isSelected ? "bg-[#cbd5e1]/[0.12] text-white border-[#cbd5e1]/70 backdrop-blur-xl scale-[1.03]" : "bg-white/[0.04] backdrop-blur-xl text-white hover:bg-white/[0.08] border-white/[0.08]"}`}>
                                  {slot.startTime}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>




          </div>
        )}

        {/* ================= STEP 1: CHOOSE SERVICE & ADD-ONS ================= */}
        {(!activeBooking && !blockedData?.isBlocked && currentStep === 1) && (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Selected Date & Time Pill Header */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs font-mono">
                <span className="text-[#cbd5e1] font-semibold">
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
                    const isSelected = selectedServiceIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        className={`p-3 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between select-none border ${isSelected
                            ? "bg-[#cbd5e1]/[0.12] text-white border-[#cbd5e1]/70 backdrop-blur-xl"
                            : "bg-white/[0.04] backdrop-blur-xl text-white hover:bg-white/[0.08] border-white/[0.08]"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4
                              className={`font-serif font-bold text-sm sm:text-base ${isSelected ? "text-[#cbd5e1]" : "text-white"
                                }`}
                            >
                              {getServiceName(s)}
                            </h4>
                            <p
                              className={`text-xs mt-1 leading-relaxed ${isSelected ? "text-neutral-300" : "text-neutral-400"
                                }`}
                            >
                              {getServiceDesc(s)}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded bg-black text-[#cbd5e1] flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between text-xs font-mono">
                          <span className={isSelected ? "text-neutral-300" : "text-neutral-400"}>
                            {s.durationMinutes} {locale === "hy" ? "րոպե" : "мин"}
                          </span>
                          <span
                            className={`font-bold ${"text-[#cbd5e1] text-sm"
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

            </div>


          </div>
        )}

        {/* ================= STEP 3: CLIENT DETAILS ================= */}
        {(!activeBooking && !blockedData?.isBlocked && currentStep === 3) && (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              {/* Detailed Summary Card */}
              <div className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "Услуга:" : locale === "hy" ? "Ծառայություն՝" : "Service:"}
                  </span>
                  <span className="text-white font-semibold">
                    {getServiceName(selectedServicesList[0])}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">
                    {locale === "ru" ? "Мастер:" : locale === "hy" ? "Վարպետ՝" : "Master:"}
                  </span>
                  <span className="text-[#cbd5e1] font-semibold">{masterBarberName}</span>
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
                  <span className="text-[#cbd5e1] font-bold text-sm">
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
                      className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] focus:border-white focus:ring-1 focus:ring-white rounded-2xl px-4 py-3.5 text-[16px] text-white placeholder-neutral-500 focus:outline-none transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono tracking-wider text-neutral-300 font-semibold uppercase mb-1.5">
                    {locale === "ru" ? "Телефон *" : locale === "hy" ? "Հեռախոսահամար *" : "Phone *"}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={guestRealPhone}
                      onChange={(e) => setGuestRealPhone(e.target.value)}
                      placeholder="+374 99 000 000"
                      className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] focus:border-white focus:ring-1 focus:ring-white rounded-2xl px-4 py-3.5 text-[16px] text-white placeholder-neutral-500 focus:outline-none transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono tracking-wider text-neutral-300 font-semibold uppercase mb-1.5">
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="aram@example.com"
                      className="w-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] focus:border-white focus:ring-1 focus:ring-white rounded-2xl px-4 py-3.5 text-[16px] text-white placeholder-neutral-500 focus:outline-none transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                      <span className="font-serif italic text-lg">@</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#cbd5e1]" />
                    <span>
                      {locale === "ru"
                        ? "Код подтверждения будет отправлен на этот email"
                        : locale === "hy"
                          ? "Հաստատման կոդն ուղարկվելու է այս էլ․ փոստին"
                          : "Verification code will be sent to this email"}
                    </span>
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-red-400/25 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Confirm & Verify Button */}
            <div className="pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                disabled={isSubmitting || !guestName.trim() || !guestPhone.trim() || !guestRealPhone.trim()}
                onClick={handleInitiateBooking}
                className="w-full py-4 px-6 rounded bg-white text-black font-serif font-bold text-base hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 shadow-[0_12px_35px_rgba(0,0,0,0.6)] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
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
        {(!activeBooking && !blockedData?.isBlocked && currentStep === 4) && (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6 text-center">
              <div className="w-14 h-14 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[#cbd5e1] mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {locale === "ru" ? "Подтверждение Email" : locale === "hy" ? "Էլ․ փոստի հաստատում" : "Email Verification"}
                </h3>
                <p className="text-xs text-neutral-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  {locale === "ru"
                    ? `Введите 4-значный проверочный код, отправленный на `
                    : locale === "hy"
                      ? `Մուտքագրեք 4-նիշ կոդը, որն ուղարկվել է `
                      : `Enter the 4-digit code sent to `}
                  <span className="text-white font-medium">{guestPhone}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-[#cbd5e1] text-xs font-mono font-medium underline underline-offset-2 mt-2 hover:text-white transition-colors"
                >
                  {locale === "ru" ? "Изменить Email" : locale === "hy" ? "Փոխել Էլ․ փոստը" : "Change Email"}
                </button>
              </div>

              {/* 4-digit code input */}
              <div className="max-w-[200px] mx-auto">
                <input
                  type="text"
                  maxLength={4}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.8em] font-mono text-3xl py-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 focus:border-white focus:ring-1 focus:ring-white text-white focus:outline-none transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                />
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-red-400/25 text-xs text-red-300">
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
                    className="text-xs font-mono text-[#cbd5e1] hover:underline cursor-pointer"
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
                disabled={isSubmitting || smsCode.length !== 4 || isRedirecting}
                onClick={handleVerifySms}
                className="w-full py-4 px-6 rounded bg-white text-black font-serif font-bold text-base hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 shadow-[0_12px_35px_rgba(0,0,0,0.6)] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
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
        {(!activeBooking && !blockedData?.isBlocked && currentStep === 5) && (
          <div className="flex-1 flex flex-col justify-between space-y-6 text-center">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded bg-white text-black flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold text-white tracking-tight">
                  {dict.successTitle}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 font-mono">
                  {dict.bookingRef}:{" "}
                  <span className="text-[#cbd5e1] font-bold">{createdBookingNumber}</span>
                </p>
              </div>

              {/* Receipt card */}
              <div className="p-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] space-y-2.5 text-xs font-mono text-left">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">{locale === "ru" ? "Гость" : locale === "hy" ? "Հյուր" : "Guest"}</span>
                  <span className="text-white">{guestName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">{locale === "ru" ? "Мастер" : locale === "hy" ? "Վարպետ" : "Master"}</span>
                  <span className="text-white">{masterBarberName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">{locale === "ru" ? "Услуга" : locale === "hy" ? "Ծառայություն" : "Service"}</span>
                  <span className="text-white truncate max-w-[150px]">{getServiceName(selectedServicesList[0])}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">{locale === "ru" ? "Дата и время" : locale === "hy" ? "Օր և Ժամ" : "Date & Time"}</span>
                  <span className="text-white">{selectedDate} • {selectedSlot?.startTime}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-white/[0.06]">
                  <span className="text-neutral-400">{locale === "ru" ? "Итого" : locale === "hy" ? "Ընդհանուր" : "Total"}</span>
                  <span className="text-[#cbd5e1] font-bold text-sm">{formatCurrency(totalPrice, locale)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6 pb-2">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="w-full py-4 px-6 rounded bg-white text-black font-serif font-bold text-base hover:bg-neutral-200 active:scale-[0.98] transition-all duration-200 shadow-[0_12px_35px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{dict.addToCalendar}</span>
              </button>

              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="block w-full py-3 px-6 rounded bg-white/[0.05] border border-white/10 text-white font-serif font-medium text-sm hover:bg-white/10 transition-all text-center cursor-pointer"
                >
                  {dict.returnHome}
                </button>
              ) : (
                <Link
                  href={`/${locale}`}
                  className="block w-full py-3 px-6 rounded bg-white/[0.05] border border-white/10 text-white font-serif font-medium text-sm hover:bg-white/10 transition-all text-center"
                >
                  {dict.returnHome}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
