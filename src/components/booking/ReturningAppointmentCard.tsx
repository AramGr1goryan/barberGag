"use client";

import React, { useState, useEffect } from "react";
import { Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/timezone";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Calendar, Clock, AlertCircle, RefreshCw, XCircle } from "lucide-react";

export interface ReturningBookingData {
  id: string;
  bookingNumber: string;
  guestName: string;
  guestPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  totalPriceMinorUnits: number;
  status: string;
  items: {
    nameSnapshot: string;
    priceSnapshotMinor: number;
    durationSnapshotMin: number;
  }[];
}

export interface ReturningAppointmentCardProps {
  locale: Locale;
  booking: ReturningBookingData;
  dict: {
    existingAppointmentTitle: string;
    existingAppointmentDesc: string;
    changeAppointment: string;
    cancelAppointment: string;
    bookingRef: string;
    duration: string;
  };
  onRescheduleSuccess: () => void;
  onCancelSuccess: () => void;
}

export function ReturningAppointmentCard({
  locale,
  booking,
  dict,
  onRescheduleSuccess,
  onCancelSuccess,
}: ReturningAppointmentCardProps) {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<{ id: string; startTime: string; endTime: string }[]>([]);
  const [selectedNewSlotId, setSelectedNewSlotId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [openDates, setOpenDates] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<"morning" | "afternoon" | "evening" | "none">("none");

  // Automatically expand first available section
  useEffect(() => {
    if (availableSlots.length > 0) {
      if (availableSlots.some(s => s.startTime < "12:00")) setExpandedSection("morning");
      else if (availableSlots.some(s => s.startTime >= "12:00" && s.startTime < "17:00")) setExpandedSection("afternoon");
      else if (availableSlots.some(s => s.startTime >= "17:00")) setExpandedSection("evening");
    } else {
      setExpandedSection("none");
    }
  }, [availableSlots]);

  useEffect(() => {
    const fetchOpenDates = async () => {
      const today = new Date();
      const end = new Date(today);
      end.setDate(today.getDate() + 60);

      const startStr = today.toISOString().split("T")[0];
      const endStr = end.toISOString().split("T")[0];

      try {
        const res = await fetch(`/api/availability/dates?start=${startStr}&end=${endStr}&duration=${booking.totalDurationMinutes}`);
        const data = await res.json();
        if (data.openDates) {
          setOpenDates(data.openDates);
        }
      } catch {}
    };

    fetchOpenDates();
  }, [booking.totalDurationMinutes]);

  const datesList = React.useMemo(() => {
    return openDates.map(dateStr => {
      const d = new Date(dateStr);
      const dayStr = String(d.getDate()).padStart(2, "0");
      const dayName = new Intl.DateTimeFormat(
        locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US",
        { weekday: "short" }
      ).format(d).replace(".", "").toUpperCase();
      
      return { dateStr, dayNum: dayStr, dayName };
    });
  }, [openDates, locale]);

  const handleDateChange = async (dateStr: string) => {
    setNewDate(dateStr);
    setSelectedNewSlotId("");
    setErrorMessage("");

    try {
      const res = await fetch(`/api/availability/slots?date=${dateStr}`);
      const data = await res.json();
      if (data.isOpen && data.slots) {
        setAvailableSlots(data.slots);
      } else {
        setAvailableSlots([]);
      }
    } catch {
      setAvailableSlots([]);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!newDate || !selectedNewSlotId) return;
    setIsRescheduling(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/booking/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          newSlotId: selectedNewSlotId,
          newDate: newDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to reschedule");
      }

      setIsRescheduleOpen(false);
      onRescheduleSuccess();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error rescheduling");
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          reason: cancelReason,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel");
      }

      setIsCancelOpen(false);
      onCancelSuccess();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Cancellation error");
    } finally {
      setIsCancelling(false);
    }
  };
  if (isRescheduleOpen) {
    return (
      <div className="w-full bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-[24px] p-4 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">Փոխել այցի ժամը</h3>
            <p className="text-[9px] sm:text-[11px] font-mono text-muted uppercase mt-0.5 sm:mt-1">Reschedule Appointment</p>
          </div>
          <button onClick={() => setIsRescheduleOpen(false)} className="text-muted hover:text-white p-1.5 sm:p-2 transition-colors rounded-full hover:bg-white/5">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-[9px] sm:text-[10px] font-bold tracking-widest text-neutral-400 mb-2 uppercase">
              Նոր Ամսաթիվ / Date
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none select-none -mx-1 px-1">
              {datesList.map((item) => {
                const isSelected = newDate === item.dateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => handleDateChange(item.dateStr)}
                    className={`min-w-[48px] h-[56px] sm:min-w-[56px] sm:h-[64px] rounded-2xl flex flex-col items-center justify-center transition-all duration-200 shrink-0 select-none cursor-pointer border ${isSelected
                        ? "bg-[#cbd5e1] border-[#cbd5e1] text-[#0f1115] shadow-[0_4px_20px_rgba(203,213,225,0.3)] scale-105"
                        : "bg-white/[0.02] border-white/10 text-[#94a3b8] hover:bg-white/[0.06] hover:border-white/20 hover:text-white"
                      }`}
                  >
                    <span className={`text-[9px] sm:text-[10px] font-mono tracking-wider font-semibold mb-0.5 sm:mb-1 ${isSelected ? "text-neutral-700" : "text-neutral-500"}`}>
                      {item.dayName}
                    </span>
                    <span className={`text-lg sm:text-xl font-display font-bold ${isSelected ? "text-black" : "text-white"}`}>
                      {item.dayNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {newDate && (
            <div>
              <label className="block text-[9px] sm:text-[10px] font-bold tracking-widest text-neutral-400 mb-2 uppercase">
                Ազատ Ժամեր / Slots
              </label>
              {availableSlots.length === 0 ? (
                <p className="text-[10px] sm:text-xs text-muted-foreground p-3 sm:p-4 rounded-[16px] border border-white/10 bg-white/[0.02] text-center">
                  Այս օրվա համար ազատ ժամեր չկան:
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[30dvh] overflow-y-auto pr-1 no-scrollbar pb-1">
                  {/* Morning */}
                  {availableSlots.some(s => s.startTime < "12:00") && (
                    <div className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
                      <button 
                        onClick={() => setExpandedSection(expandedSection === "morning" ? "none" : "morning")}
                        className="w-full flex items-center justify-between p-2.5 sm:p-3.5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-neutral-300 uppercase font-bold">{locale === "ru" ? "Утро" : locale === "hy" ? "Առավոտ" : "Morning"}</span>
                        <span className="text-muted font-mono">{expandedSection === "morning" ? "-" : "+"}</span>
                      </button>
                      {expandedSection === "morning" && (
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-2.5 sm:p-3 pt-0">
                          {availableSlots.filter(s => s.startTime < "12:00").map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedNewSlotId(slot.id)}
                              className={`py-2 sm:py-3.5 px-1 sm:px-2 rounded-xl text-xs sm:text-[13px] font-mono font-medium transition-all duration-200 border ${
                                selectedNewSlotId === slot.id
                                  ? "bg-white text-black border-white shadow-md scale-105"
                                  : "bg-black/20 text-white/80 border-white/10 hover:border-white/30 hover:bg-white/5"
                              }`}
                            >
                              {slot.startTime}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Afternoon */}
                  {availableSlots.some(s => s.startTime >= "12:00" && s.startTime < "17:00") && (
                    <div className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
                      <button 
                        onClick={() => setExpandedSection(expandedSection === "afternoon" ? "none" : "afternoon")}
                        className="w-full flex items-center justify-between p-2.5 sm:p-3.5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-neutral-300 uppercase font-bold">{locale === "ru" ? "День" : locale === "hy" ? "Կեսօր" : "Afternoon"}</span>
                        <span className="text-muted font-mono">{expandedSection === "afternoon" ? "-" : "+"}</span>
                      </button>
                      {expandedSection === "afternoon" && (
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-2.5 sm:p-3 pt-0">
                          {availableSlots.filter(s => s.startTime >= "12:00" && s.startTime < "17:00").map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedNewSlotId(slot.id)}
                              className={`py-2 sm:py-3.5 px-1 sm:px-2 rounded-xl text-xs sm:text-[13px] font-mono font-medium transition-all duration-200 border ${
                                selectedNewSlotId === slot.id
                                  ? "bg-white text-black border-white shadow-md scale-105"
                                  : "bg-black/20 text-white/80 border-white/10 hover:border-white/30 hover:bg-white/5"
                              }`}
                            >
                              {slot.startTime}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evening */}
                  {availableSlots.some(s => s.startTime >= "17:00") && (
                    <div className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
                      <button 
                        onClick={() => setExpandedSection(expandedSection === "evening" ? "none" : "evening")}
                        className="w-full flex items-center justify-between p-2.5 sm:p-3.5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-neutral-300 uppercase font-bold">{locale === "ru" ? "Вечер" : locale === "hy" ? "Երեկո" : "Evening"}</span>
                        <span className="text-muted font-mono">{expandedSection === "evening" ? "-" : "+"}</span>
                      </button>
                      {expandedSection === "evening" && (
                        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-2.5 sm:p-3 pt-0">
                          {availableSlots.filter(s => s.startTime >= "17:00").map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => setSelectedNewSlotId(slot.id)}
                              className={`py-2 sm:py-3.5 px-1 sm:px-2 rounded-xl text-xs sm:text-[13px] font-mono font-medium transition-all duration-200 border ${
                                selectedNewSlotId === slot.id
                                  ? "bg-white text-black border-white shadow-md scale-105"
                                  : "bg-black/20 text-white/80 border-white/10 hover:border-white/30 hover:bg-white/5"
                              }`}
                            >
                              {slot.startTime}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <p className="text-[10px] sm:text-[11px] text-red-400 font-medium bg-red-500/10 p-2.5 sm:p-3 rounded-xl border border-red-500/20">{errorMessage}</p>
          )}

          <div className="pt-1">
            <button
              disabled={!selectedNewSlotId || isRescheduling}
              onClick={handleConfirmReschedule}
              className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold tracking-wide transition-all ${
                selectedNewSlotId 
                  ? "bg-white text-black hover:bg-neutral-200 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              }`}
            >
              {isRescheduling ? "Խնդրում ենք սպասել..." : "Հաստատել փոփոխությունը"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCancelOpen) {
    return (
      <div className="w-full bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-[24px] p-4 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">Չեղարկել ամրագրումը</h3>
            <p className="text-[9px] sm:text-[11px] font-mono text-muted uppercase mt-0.5 sm:mt-1">Cancel Appointment</p>
          </div>
          <button onClick={() => setIsCancelOpen(false)} className="text-muted hover:text-white p-1.5 sm:p-2 transition-colors rounded-full hover:bg-white/5">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-[9px] sm:text-[10px] font-bold tracking-widest text-neutral-400 mb-2 uppercase">
              Չեղարկման պատճառ (ոչ պարտադիր)
            </label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Օրինակ՝ պլանների փոփոխություն..."
              className="w-full bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-xs sm:text-sm text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-neutral-600"
            />
          </div>

          {errorMessage && (
            <p className="text-[10px] sm:text-[11px] text-red-400 font-medium bg-red-500/10 p-2.5 sm:p-3 rounded-xl border border-red-500/20">{errorMessage}</p>
          )}

          <div className="pt-1">
            <button
              disabled={isCancelling}
              onClick={handleConfirmCancel}
              className="w-full py-3 sm:py-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold tracking-wide transition-all hover:bg-red-500/20 active:scale-95"
            >
              {isCancelling ? "Խնդրում ենք սպասել..." : "Այո, չեղարկել"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-[24px] p-5 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-2xl mx-auto space-y-6 sm:space-y-8">
      {/* Alert Header */}
      <div className="flex items-start space-x-3 sm:space-x-4 border-b border-white/10 pb-5 sm:pb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border border-slate-300/30 bg-slate-200/10 flex items-center justify-center text-slate-200 shrink-0 shadow-[0_0_20px_rgba(203,213,225,0.15)]">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <span className="text-[9px] sm:text-[11px] font-mono tracking-widest text-slate-200 uppercase font-semibold">
            {dict.bookingRef}: {booking.bookingNumber}
          </span>
          <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">
            {dict.existingAppointmentTitle}
          </h2>
          <p className="text-[10px] sm:text-xs text-muted mt-1 leading-relaxed">
            {dict.existingAppointmentDesc}
          </p>
        </div>
      </div>

      {/* Appointment Overview */}
      <div className="bg-white/[0.02] border border-white/10 rounded-[16px] p-4 sm:p-6 space-y-3 sm:space-y-4 font-mono text-[10px] sm:text-xs">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 sm:pb-3">
          <span className="text-muted uppercase">Հաճախորդ</span>
          <span className="text-foreground font-semibold font-sans truncate ml-4 text-right max-w-[150px] sm:max-w-none">{booking.guestName}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2.5 sm:pb-3 gap-1">
          <span className="text-muted uppercase">Ամսաթիվ և Ժամ</span>
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-slate-200 font-bold self-end sm:self-auto">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{booking.date}</span>
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1 sm:ml-2" />
            <span>{booking.startTime} - {booking.endTime}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2.5 sm:pb-3 gap-1">
          <span className="text-muted uppercase">Ծառայություններ</span>
          <div className="text-right font-sans truncate self-end sm:self-auto text-xs sm:text-sm">
            {booking.items.map((item, idx) => (
              <span key={idx} className="block text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                {item.nameSnapshot}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-muted uppercase">Ընդհանուր Արժեք</span>
          <span className="text-sm sm:text-base font-bold text-slate-200">
            {formatCurrency(booking.totalPriceMinorUnits, locale)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5 pt-1">
        <button
          onClick={() => setIsRescheduleOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-zinc-100 text-zinc-900 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold tracking-wide hover:bg-white active:scale-95 transition-all"
        >
          <span>{dict.changeAppointment}</span>
        </button>

        <button
          onClick={() => setIsCancelOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-xl sm:rounded-2xl text-xs sm:text-[13px] font-bold tracking-wide hover:bg-zinc-800 hover:text-white active:scale-95 transition-all"
        >
          <span>{dict.cancelAppointment}</span>
        </button>
      </div>
    </div>
  );
}

