"use client";

import React, { useState } from "react";
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

  const datesList = React.useMemo(() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dayStr = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${dayStr}`;
      
      const dayName = new Intl.DateTimeFormat(
        locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US",
        { weekday: "short" }
      ).format(d).replace(".", "").toUpperCase();
      
      list.push({ dateStr, dayNum: dayStr, dayName });
    }
    return list;
  }, [locale]);

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

  return (
    <div className="bg-surface/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-2xl mx-auto space-y-8">
      {/* Alert Header */}
      <div className="flex items-start space-x-4 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-2xl border border-slate-300/30 bg-slate-200/10 flex items-center justify-center text-slate-200 shrink-0 shadow-[0_0_20px_rgba(203,213,225,0.15)]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[11px] font-mono tracking-widest text-slate-200 uppercase font-semibold">
            {dict.bookingRef}: {booking.bookingNumber}
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1">
            {dict.existingAppointmentTitle}
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            {dict.existingAppointmentDesc}
          </p>
        </div>
      </div>

      {/* Appointment Overview */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <span className="text-muted uppercase">Հաճախորդ / Client</span>
          <span className="text-foreground font-semibold font-sans">{booking.guestName}</span>
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <span className="text-muted uppercase">Ամսաթիվ և Ժամ</span>
          <div className="flex items-center space-x-2 text-slate-200 font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{booking.date}</span>
            <Clock className="w-3.5 h-3.5 ml-2" />
            <span>{booking.startTime} - {booking.endTime}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <span className="text-muted uppercase">Ծառայություններ</span>
          <div className="text-right font-sans">
            {booking.items.map((item, idx) => (
              <span key={idx} className="block text-foreground">
                {item.nameSnapshot}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-muted uppercase">Ընդհանուր Արժեք</span>
          <span className="text-base font-bold text-slate-200">
            {formatCurrency(booking.totalPriceMinorUnits, locale)}
          </span>
        </div>
      </div>

      {/* Action Buttons - Only Reschedule and Cancel */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Button
          variant="outline"
          onClick={() => setIsRescheduleOpen(true)}
          className="flex-1 gap-2 py-3.5 border-zinc-500/30 text-zinc-200 hover:bg-zinc-800/50 rounded-2xl"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{dict.changeAppointment}</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setIsCancelOpen(true)}
          className="flex-1 gap-2 py-3.5 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-2xl"
        >
          <XCircle className="w-4 h-4" />
          <span>{dict.cancelAppointment}</span>
        </Button>
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Փոխել այցի ժամը / Reschedule Appointment"
        description="Ընտրեք նոր ամսաթիվ և ազատ ժամ:"
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-mono text-muted mb-1.5 uppercase">
              Նոր Ամսաթիվ (Date)
            </label>
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-none select-none -mx-1 px-1">
              {datesList.map((item) => {
                const isSelected = newDate === item.dateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => handleDateChange(item.dateStr)}
                    className={`min-w-[56px] h-[64px] rounded-[16px] flex flex-col items-center justify-center transition-all duration-200 shrink-0 select-none cursor-pointer border ${isSelected
                        ? "bg-[#cbd5e1] border-[#cbd5e1] text-[#0f1115] shadow-[0_4px_20px_rgba(203,213,225,0.3)] scale-[1.02]"
                        : "bg-white/[0.02] border-white/10 text-[#94a3b8] hover:bg-white/[0.06] hover:border-white/20 hover:text-white"
                      }`}
                  >
                    <span className={`text-[10px] font-mono tracking-wider font-semibold mb-1 ${isSelected ? "text-neutral-700" : "text-neutral-500"}`}>
                      {item.dayName}
                    </span>
                    <span className={`text-xl font-display font-bold ${isSelected ? "text-black" : "text-white"}`}>
                      {item.dayNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {newDate && (
            <div>
              <label className="block text-xs font-mono text-muted mb-2 uppercase">
                Ազատ Ժամեր (Available Slots)
              </label>
              {availableSlots.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3.5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  Այս օրվա համար ազատ ժամեր չկան կամ օրը փակ է:
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedNewSlotId(slot.id)}
                      className={`py-3.5 px-2 rounded-2xl text-[13px] font-mono font-medium transition-all duration-300 transform border shadow-sm ${
                        selectedNewSlotId === slot.id
                          ? "bg-[#cbd5e1] text-black border-[#cbd5e1] shadow-[0_0_20px_rgba(203,213,225,0.4)] scale-[1.02]"
                          : "bg-white/[0.03] text-white/90 border-white/10 hover:border-[#cbd5e1]/50 hover:bg-white/[0.06] hover:scale-[1.02]"
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
          )}

          <div className="pt-4 flex justify-end space-x-3">
            <Button variant="ghost" onClick={() => setIsRescheduleOpen(false)}>
              Փակել
            </Button>
            <Button
              variant="primary"
              disabled={!selectedNewSlotId}
              isLoading={isRescheduling}
              onClick={handleConfirmReschedule}
            >
              Հաստատել փոփոխությունը
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Չեղարկել ամրագրումը / Cancel Appointment"
        description="Վստա՞հ եք, որ ցանկանում եք չեղարկել Ձեր ամրագրումը:"
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-mono text-muted mb-1.5 uppercase">
              Չեղարկման պատճառ (ոչ պարտադիր)
            </label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Օրինակ՝ պլանների փոփոխություն..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-3.5 text-xs text-foreground focus:outline-none focus:border-slate-300/60 transition-all"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
          )}

          <div className="pt-4 flex justify-end space-x-3">
            <Button variant="ghost" onClick={() => setIsCancelOpen(false)}>
              Հետ
            </Button>
            <Button
              variant="danger"
              isLoading={isCancelling}
              onClick={handleConfirmCancel}
            >
              Այո, չեղարկել
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
