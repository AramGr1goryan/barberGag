"use client";

import React, { useState, useEffect } from "react";
import { Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/timezone";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReturningAppointmentCard, ReturningBookingData } from "./ReturningAppointmentCard";
import { BlockedBookingCard } from "./BlockedBookingCard";
import { LuxuryCalendarPicker } from "./LuxuryCalendarPicker";
import { Check, Clock, Scissors, ShieldAlert, ArrowLeft, ArrowRight, CheckCircle2, Download, ChevronDown } from "lucide-react";
import Link from "next/link";

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

  // Stepper state (1: Services, 2: Date/Time, 3: Details, 4: SMS, 5: Confirmation)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || services[0]?.id || "");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [openDates, setOpenDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{ id: string; startTime: string; endTime: string }[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [isDayClosed, setIsDayClosed] = useState<boolean>(false);

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

  // Fetch open dates in the next 30 days
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
          if (data.openDates.length > 0 && !selectedDate) {
            setSelectedDate(data.openDates[0]);
          }
        }
      } catch {
        setOpenDates([]);
      }
    };

    fetchOpenDates();
  }, [selectedDate]);

  // Fetch slots for selected date
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedDate) return;
    const fetchSlots = async () => {
      setSelectedSlotId("");
      setIsLoadingSlots(true);
      try {
        const res = await fetch(`/api/availability/slots?date=${selectedDate}`);
        const data = await res.json();
        if (data.isOpen) {
          setIsDayClosed(false);
          setAvailableSlots(data.slots || []);
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
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedAddonsList = addons.filter((a) => selectedAddonIds.includes(a.id));
  const totalDuration = (selectedService?.durationMinutes || 0) + selectedAddonsList.reduce((acc, a) => acc + a.durationMinutes, 0);
  const totalPrice = (selectedService?.priceMinorUnits || 0) + selectedAddonsList.reduce((acc, a) => acc + a.priceMinorUnits, 0);

  const getServiceName = (s: ServiceItem) =>
    locale === "ru" ? s.nameRu : locale === "en" ? s.nameEn : s.nameHy;
  const getAddonName = (a: AddonItem) =>
    locale === "ru" ? a.nameRu : locale === "en" ? a.nameEn : a.nameHy;

  // Toggle addon
  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Step 3 -> 4: Submit booking and request SMS verification
  const handleInitiateBooking = async () => {
    if (!selectedServiceId || !selectedDate || !selectedSlotId || !guestName || !guestPhone) {
      setErrorMessage("Please fill all required fields.");
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
      setCurrentStep(4); // Move to SMS verification step
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error initiating booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Verify SMS code - strictly succeeds ONLY when OTP code is correct!
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

        // If 3 incorrect attempts reached, cancel booking and redirect to home page!
        if (
          data.redirectToHome ||
          data.status === "MAX_ATTEMPTS_EXCEEDED" ||
          (typeof data.attemptsLeft === "number" && data.attemptsLeft <= 0)
        ) {
          setIsRedirecting(true);
          setErrorMessage(
            locale === "ru"
              ? "3 раза введен неверный код. Запись отменена. Перенаправление на главную..."
              : locale === "hy"
              ? "3 անգամ սխալ կոդ եք մուտքագրել: Գրանցումը չեղարկված է: Տեղափոխում գլխավոր էջ..."
              : "3 incorrect attempts. Booking cancelled. Redirecting to home..."
          );
          setTimeout(() => {
            window.location.href = `/${locale}`;
          }, 2200);
          return;
        }

        throw new Error(data.error || "Invalid verification code");
      }

      // ONLY reach step 5 when the OTP code was verified successfully!
      setCurrentStep(5);
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
    const selectedSlot = availableSlots.find((s) => s.id === selectedSlotId);
    const startHour = selectedSlot?.startTime || "10:00";
    const endHour = selectedSlot?.endTime || "11:00";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Gagik Ghambaryan Barbershop//NONSGML v1.0//EN",
      "BEGIN:VEVENT",
      `SUMMARY:Appointment with Master Barber Gagik Ghambaryan`,
      `DESCRIPTION:${getServiceName(selectedService!)} (Ref: ${createdBookingNumber})`,
      `LOCATION:10 Northern Avenue, Yerevan`,
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

  // If user is blocked due to cancellation cooldown, show BlockedBookingCard!
  if (!isCheckingActive && blockedData?.isBlocked) {
    return (
      <BlockedBookingCard
        locale={locale}
        blockedUntil={blockedData.blockedUntil}
        initialSeconds={blockedData.remainingSeconds}
        cooldownHours={blockedData.cooldownHours}
      />
    );
  }

  // If returning visitor has active appointment, immediately show ReturningAppointmentCard (no other bookings allowed!)
  if (!isCheckingActive && activeBooking) {
    return (
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
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-5 sm:p-8 transition-all">
      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono tracking-widest text-accent uppercase font-semibold">
            {dict.step1} {currentStep} / 4
          </span>
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground uppercase tracking-tight">
            {currentStep === 1 && dict.step1}
            {currentStep === 2 && dict.step2}
            {currentStep === 3 && dict.step3}
            {currentStep === 4 && dict.smsVerificationTitle}
            {currentStep === 5 && dict.successTitle}
          </h2>
        </div>

        {/* Live Summary Pill */}
        {currentStep < 5 && (
          <div className="hidden sm:flex flex-col text-right font-mono text-[11px]">
            <span className="text-accent font-bold text-xs">
              {formatCurrency(totalPrice, locale)}
            </span>
            <span className="text-muted">
              {totalDuration} {locale === "hy" ? "րոպե" : "min"}
            </span>
          </div>
        )}
      </div>

      {/* STEP 1: Select Service & Addons */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* MOBILE ONLY: Dropdown Selector for Primary Service */}
          <div className="block md:hidden p-4 rounded-2xl bg-[#141419] border border-accent/40 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-accent" />
                <span>
                  {locale === "ru"
                    ? "Услуга (Dropdown)"
                    : locale === "hy"
                    ? "Ծառայություն (Dropdown)"
                    : "Service (Dropdown)"}
                </span>
              </label>
              {selectedService && (
                <span className="text-[11px] font-mono text-accent font-bold">
                  {formatCurrency(selectedService.priceMinorUnits, locale)} • {selectedService.durationMinutes} {locale === "hy" ? "ր" : "мин"}
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full bg-[#181820] border border-white/20 hover:border-accent focus:border-accent text-white font-medium text-xs rounded-xl px-3.5 py-2.5 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all [color-scheme:dark]"
              >
                <option value="" disabled className="bg-[#181820] text-muted">
                  {locale === "ru"
                    ? "— Выберите услугу из списка —"
                    : locale === "hy"
                    ? "— Ընտրեք ծառայությունը —"
                    : "— Select service —"}
                </option>
                {services.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#181820] text-white py-1 text-xs">
                    {getServiceName(s)} — {s.durationMinutes} {locale === "hy" ? "րոպե" : "мин"} | {formatCurrency(s.priceMinorUnits, locale)}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-accent">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* PC / TABLET ONLY: Interactive Service Cards */}
          <div className="hidden md:block">
            <h3 className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground mb-3 font-semibold">
              {locale === "ru" ? "Основная услуга" : locale === "hy" ? "Հիմնական Ծառայություն" : "Primary Service"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {services.map((s) => {
                const isSelected = selectedServiceId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedServiceId(s.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? "bg-accent/[0.08] border-accent shadow-[0_0_20px_rgba(197,168,128,0.25)] ring-1 ring-accent/60"
                        : "bg-white/[0.02] border-white/10 hover:border-accent/40 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-display font-bold text-xs text-foreground">
                          {getServiceName(s)}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />}
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed line-clamp-2">
                        {locale === "hy" ? s.descriptionHy : locale === "ru" ? s.descriptionRu : s.descriptionEn}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-muted">{s.durationMinutes} {locale === "hy" ? "ր" : "мин"}</span>
                      <span className="text-accent font-bold">
                        {formatCurrency(s.priceMinorUnits, locale)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add-ons */}
          <div>
            <h3 className="text-xs uppercase font-mono tracking-wider text-muted-foreground mb-4">
              Լրացուցիչ Խնամք (Enhancing Add-ons)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addons.map((a) => {
                const isSelected = selectedAddonIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    onClick={() => toggleAddon(a.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? "bg-accent/[0.08] border-accent"
                        : "bg-white/[0.02] border-white/10 hover:border-accent/40 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isSelected ? "bg-accent border-accent text-accent-foreground" : "border-white/20 bg-white/[0.03]"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-foreground font-medium">{getAddonName(a)}</span>
                    </div>
                    <span className="font-mono text-accent font-semibold">
                      +{formatCurrency(a.priceMinorUnits, locale)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setCurrentStep(2)}
              disabled={!selectedServiceId}
              className="gap-2"
            >
              <span>{dict.continue}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Date & Available Slots */}
      {currentStep === 2 && (
        <div className="space-y-8">
          <LuxuryCalendarPicker
            locale={locale}
            openDates={openDates}
            selectedDate={selectedDate}
            onSelectDate={(dateStr) => setSelectedDate(dateStr)}
            availableSlots={availableSlots}
            selectedSlotId={selectedSlotId}
            onSelectSlot={(slotId) => setSelectedSlotId(slotId)}
            isDayClosed={isDayClosed}
            isLoadingSlots={isLoadingSlots}
            dict={{
              selectDate: dict.selectDate,
              selectTime: dict.selectTime,
              noSlotsTitle: dict.noSlotsTitle,
              noSlotsDesc: dict.noSlotsDesc,
            }}
          />

          <div className="flex justify-between pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setCurrentStep(1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>{dict.back}</span>
            </Button>

            <Button
              variant="primary"
              onClick={() => setCurrentStep(3)}
              disabled={!selectedDate || !selectedSlotId}
              className="gap-2"
            >
              <span>{dict.continue}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Client Details */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-muted">Ծառայություն:</span>
              <span className="text-foreground font-semibold">{getServiceName(selectedService!)!}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ամսաթիվ և Ժամ:</span>
              <span className="text-accent font-semibold">
                {selectedDate} • {availableSlots.find((s) => s.id === selectedSlotId)?.startTime}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-muted">Ընդհանուր գումար:</span>
              <span className="text-accent font-bold text-sm">
                {formatCurrency(totalPrice, locale)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label={dict.guestName}
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Արամ Սարգսյան"
            />

            <Input
              label={dict.guestPhone}
              required
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="+374 91 000000"
              helperText="Հաստատման կոդն ուղարկվելու է նշված համարին (SMS verification)"
            />
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 text-xs text-red-300">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-white/10">
            <Button variant="ghost" onClick={() => setCurrentStep(2)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>{dict.back}</span>
            </Button>

            <Button
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={!guestName || !guestPhone}
              onClick={handleInitiateBooking}
              className="gap-2"
            >
              <span>{dict.confirmBooking}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: SMS Verification */}
      {currentStep === 4 && (
        <div className="space-y-6 max-w-md mx-auto py-4">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl border border-accent/30 bg-accent/10 flex items-center justify-center text-accent mx-auto shadow-[0_0_25px_rgba(197,168,128,0.2)]">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground">
              {dict.smsVerificationTitle}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {dict.smsVerificationDesc} <strong className="text-foreground">{guestPhone}</strong>
            </p>
          </div>

          <div>
            <input
              type="text"
              maxLength={6}
              disabled={isSubmitting || isRedirecting}
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full text-center tracking-[0.6em] text-2xl font-mono py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all disabled:opacity-50"
            />
          </div>

          {/* Remaining Attempts Indicator */}
          <div className="flex items-center justify-center space-x-1.5 text-xs font-mono">
            <span className="text-muted">
              {locale === "ru"
                ? "Осталось попыток:"
                : locale === "hy"
                ? "Մնացել է փորձ:"
                : "Attempts left:"}
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                attemptsLeft <= 1
                  ? "bg-red-950/40 text-red-400 border border-red-500/30"
                  : "bg-accent/10 text-accent border border-accent/20"
              }`}
            >
              {attemptsLeft} / 3
            </span>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-400 font-medium text-center">{errorMessage}</p>
          )}

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full py-3.5 text-sm"
              isLoading={isSubmitting}
              disabled={smsCode.length !== 6}
              onClick={handleVerifySms}
            >
              {dict.verifyBtn}
            </Button>

            <div className="text-center">
              {resendCooldown > 0 ? (
                <span className="text-xs font-mono text-muted">
                  {dict.resendCooldown.replace("{seconds}", String(resendCooldown))}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendSms}
                  className="text-xs font-mono text-accent hover:underline"
                >
                  {dict.resendCode}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Booking Confirmation */}
      {currentStep === 5 && (
        <div className="text-center py-8 space-y-6 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full border border-accent/30 bg-accent/10 flex items-center justify-center text-accent mx-auto shadow-[0_0_30px_rgba(197,168,128,0.2)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono tracking-widest text-accent uppercase font-bold">
              {dict.bookingRef}: {createdBookingNumber}
            </span>
            <h3 className="font-display text-2xl font-bold text-foreground">
              {dict.successTitle}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Ձեր ամրագրումը հաջողությամբ գրանցված է: Սիրով սպասում ենք Ձեզ նշված ժամին:
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-xs font-mono space-y-2.5 text-left">
            <div className="flex justify-between">
              <span className="text-muted">Ամսաթիվ:</span>
              <span className="text-foreground font-bold">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ժամ:</span>
              <span className="text-accent font-bold">
                {availableSlots.find((s) => s.id === selectedSlotId)?.startTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ծառայություն:</span>
              <span className="text-foreground">{getServiceName(selectedService!)!}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Հասցե:</span>
              <span className="text-foreground">Հյուսիսային պողոտա 10</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button variant="secondary" onClick={handleDownloadIcs} className="w-full gap-2">
              <Download className="w-4 h-4 text-accent" />
              <span>{dict.addToCalendar}</span>
            </Button>

            <Link href={`/${locale}`}>
              <Button variant="primary" className="w-full">
                {dict.returnHome}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ONE-HANDED MOBILE STICKY BOTTOM BAR (STEPS 1, 2, 3) */}
      {currentStep < 4 && (
        <div className="md:hidden fixed bottom-3 left-3 right-3 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-auto bg-[#13151f]/95 backdrop-blur-2xl border border-white/[0.15] rounded-2xl p-3.5 shadow-[0_12px_45px_rgba(0,0,0,0.7),0_0_25px_rgba(197,168,128,0.15)] flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider truncate">
                {currentStep === 1
                  ? (selectedService ? getServiceName(selectedService) : "Ծառայություն")
                  : currentStep === 2
                  ? (selectedDate ? `${selectedDate} ${availableSlots.find((s) => s.id === selectedSlotId)?.startTime || ""}` : "Ընտրեք ժամ")
                  : `${guestName || "Հաճախորդ"}`}
              </span>
              <span className="text-sm font-mono font-bold text-accent">
                {formatCurrency(totalPrice, locale)}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-muted hover:text-foreground active:scale-95 transition-all"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              {currentStep === 1 && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCurrentStep(2)}
                  disabled={!selectedServiceId}
                  className="gap-2 px-5 py-2.5 rounded-xl font-semibold tracking-wider text-xs"
                >
                  <span>{dict.continue}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}

              {currentStep === 2 && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCurrentStep(3)}
                  disabled={!selectedSlotId}
                  className="gap-2 px-5 py-2.5 rounded-xl font-semibold tracking-wider text-xs"
                >
                  <span>{dict.continue}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}

              {currentStep === 3 && (
                <Button
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  disabled={!guestName || !guestPhone}
                  onClick={handleInitiateBooking}
                  className="gap-2 px-5 py-2.5 rounded-xl font-semibold tracking-wider text-xs"
                >
                  <span>{dict.confirmBooking}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
