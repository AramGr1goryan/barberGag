"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Plus, Check, X, ArrowLeft, Sunrise, Sun, Moon, Trash2, ChevronDown, Edit2 } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import Link from "next/link";


function SwipeBooking({ task, isDone, locale, onToggleTask, onDelete, onEdit }: any) {
  const controls = useAnimation();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDrag = (e: any, info: any) => {
    // Only care about swiping left (negative x)
    if (info.offset.x < -140) {
      setIsDeleting(true);
    } else {
      setIsDeleting(false);
    }
  };

  const handleDragEnd = async (e: any, info: any) => {
    if (info.offset.x < -140) {
      // Long swipe -> direct confirm
      if (confirm(locale === "ru" ? "Удалить запись?" : "Delete booking?")) {
        onDelete(task.id, true);
      } else {
        controls.start({ x: 0 });
        setIsOpen(false);
      }
    } else if (info.offset.x < -50 || (isOpen && info.offset.x < 0)) {
      // Short swipe -> snap open
      controls.start({ x: -80 });
      setIsOpen(true);
    } else {
      // Snap closed
      controls.start({ x: 0 });
      setIsOpen(false);
    }
    setIsDeleting(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(locale === "ru" ? "Удалить запись?" : "Delete booking?")) {
      onDelete(task.id, true);
    } else {
      controls.start({ x: 0 });
      setIsOpen(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 group bg-zinc-800">
      <div 
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-6 text-white font-bold w-1/2 h-full bg-red-600 cursor-pointer"
        onClick={handleDeleteClick}
      >
        <Trash2 className={`w-5 h-5 ${isDeleting ? 'animate-pulse scale-125 transition-transform' : 'transition-transform'}`} />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={`relative z-10 w-full flex items-center justify-between p-3 transition-colors cursor-pointer ${isDone ? "bg-[#14281e] border-emerald-500/20" : "bg-[#1d202c]"}`}
        onClick={(e) => {
          // If we clicked exactly on the card (not dragging and not checkbox)
          if (!isOpen) onEdit(task);
          else {
            controls.start({ x: 0 });
            setIsOpen(false);
          }
        }}
      >
        <div className="flex items-center gap-3 w-full pr-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleTask(task); }} 
            className={`shrink-0 w-6 h-6 rounded flex items-center justify-center border transition-colors ${isDone ? "bg-emerald-500 border-emerald-500 text-black" : "border-white/30"}`}
          >
            <Check className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-bold text-blue-300 shrink-0">{task.startTime}-{task.endTime}</span>
              <span className={`text-[16px] font-bold truncate ${isDone ? "line-through text-muted" : "text-white"}`}>{task.guestName}</span>
            </div>
            
            <div className={`text-sm font-semibold truncate mt-0.5 ${isDone ? "text-emerald-500/70" : "text-blue-100/90"}`}>
              ✂ {task.items.map((i: any) => i.nameSnapshot).join(" + ")}
            </div>

            <div className="text-[11px] text-muted font-mono truncate mt-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {task.guestRealPhone ? (
                <>
                  <a href={`tel:${task.guestRealPhone}`} className="text-primary hover:underline">📞 {task.guestRealPhone}</a>
                  {task.guestPhone && !task.guestPhone.startsWith("—") && <span className="opacity-50">• {task.guestPhone}</span>}
                </>
              ) : (
                <a href={`tel:${task.guestPhone}`} className="text-primary hover:underline">📞 {task.guestPhone}</a>
              )}
            </div>

            {task.notes && (
              <div className="text-[11px] text-zinc-400 mt-1.5 bg-white/5 rounded px-2 py-1 leading-tight border border-white/10 whitespace-pre-wrap">
                📝 {task.notes}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function BarberCalendarManager() {

  const { t, locale } = useAdminI18n();
  
  const getTodayYerevanStr = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const yerevan = new Date(utc + (3600000 * 4));
    return yerevan.toISOString().split("T")[0];
  };
  const [selectedDate, setSelectedDate] = useState<string>(getTodayYerevanStr());

  const hasFetchedFullDays = useRef(false);

  const [openDays, setOpenDays] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [dayBookings, setDayBookings] = useState<any[]>([]);
  const [daySlots, setDaySlots] = useState<any[]>([]);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("+374 ");
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServicePrice, setCustomServicePrice] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState(0);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isCustomService, setIsCustomService] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState("0");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const fetchData = useCallback(async (date: string, forceFull = false) => {
    setIsLoading(true);
    try {
      // If we already have openDays, we don't need to re-fetch the entire 60 days on every click.
      const isLite = hasFetchedFullDays.current && !forceFull;
      const res = await fetch(`/api/admin/barber-calendar?date=${date}${isLite ? "&lite=true" : ""}&_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!res.ok) throw new Error("");
      const data = await res.json();

      if (data.openDays && data.openDays.length > 0) {
        setOpenDays(data.openDays);
        hasFetchedFullDays.current = true;
      }
      if (data.services && data.services.length > 0) setServices(data.services);

      if (data.selectedDayDetails) {
        setDayBookings(data.selectedDayDetails.bookings || []);
        setDaySlots(data.selectedDayDetails.slots || []);
        setIsDayOpen(data.selectedDayDetails.isOpen || false);
      }
    } catch { } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(selectedDate); }, [selectedDate, fetchData]);

  const handleToggleDay = async (open: boolean) => {
    try {
      await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleDay", date: selectedDate, isOpen: open, duration: open ? 60 : undefined })
      });
      fetchData(selectedDate, true);
    } catch { }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm(locale === "ru" ? "Удалить час?" : "Delete hour?")) return;
    try {
      await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteSlot", slotId })
      });
      fetchData(selectedDate, true);
    } catch { }
  };

  const handleToggleTask = async (task: any) => {
    const nextCompleted = task.status !== "COMPLETED";
    setDayBookings(prev => prev.map(b => b.id === task.id ? { ...b, status: nextCompleted ? "COMPLETED" : "CONFIRMED" } : b));
    try {
      await fetch("/api/admin/barber-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleTask", bookingId: task.id, completed: nextCompleted })
      });
      fetchData(selectedDate, true);
    } catch { fetchData(selectedDate, true); }
  };

  
  const handleBlockRange = async () => {
    const start = window.prompt(locale === "ru" ? "Время начала (например, 14:00):" : "Start time (e.g. 14:00):", "");
    if (!start) return;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start.trim())) {
      alert(locale === "ru" ? "Неверный формат времени (нужно ЧЧ:ММ)" : "Invalid time format (HH:MM)");
      return;
    }
    const end = window.prompt(locale === "ru" ? "Время окончания (например, 16:00):" : "End time (e.g. 16:00):", "");
    if (!end) return;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(end.trim())) {
      alert(locale === "ru" ? "Неверный формат времени (нужно ЧЧ:ММ)" : "Invalid time format (HH:MM)");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "blockRange", date: selectedDate, startTime: start.trim(), endTime: end.trim() })
      });
      if (!res.ok) {
        const d = await res.json().catch(()=>({}));
        alert(d.error || "Error");
      }
      fetchData(selectedDate, true);
    } catch {
      fetchData(selectedDate, true);
    }
  };

  const handleAddOpenSlot = async () => {
    const time = window.prompt(locale === "ru" ? "Введите время (например, 14:00):" : "Enter time (e.g. 14:00):", "");
    if (!time) return;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      alert(locale === "ru" ? "Неверный формат времени (нужно ЧЧ:ММ)" : "Invalid time format (HH:MM)");
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createSlot", date: selectedDate, startTime: time.trim(), durationMinutes: 60 })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((locale === "ru" ? "Ошибка: " : "Error: ") + (err.error || "Failed"));
      } else {
        fetchData(selectedDate, true);
      }
    } catch {
      alert(locale === "ru" ? "Ошибка сети" : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (id: string) => {
    setIsCustomService(false);
    setSelectedServiceIds(prev => {
      const newIds = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      // compute totals
      let totalTime = 0;
      let totalPrice = 0;
      newIds.forEach(srvId => {
        const srv = services.find(s => s.id === srvId);
        if (srv) {
          totalTime += srv.durationMinutes;
          totalPrice += srv.priceMinorUnits / 100;
        }
      });
      setBookingDuration(totalTime || 60);
      setDefaultPrice(String(totalPrice || 0));
      return newIds;
    });
  };
  const toggleCustom = () => {
    setIsCustomService(!isCustomService);
    if (!isCustomService) {
      setSelectedServiceIds([]);
      setBookingDuration(60);
      setDefaultPrice("0");
    }
  };

  const onSubmitBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const [startH, startM] = bookingTime.split(":").map(Number);
    const maxDuration = 24 * 60 - (startH * 60 + startM);
    if (bookingDuration > maxDuration) {
      alert(locale === "ru" ? "Невозможно записать: рабочий день заканчивается в 00:00. Доступно только " + maxDuration + " мин." : "Cannot book: working day ends at 00:00. Only " + maxDuration + " mins available.");
      setIsSubmitting(false);
      return;
    }

    const cName = fd.get("cName") as string;
    const cPhone = fd.get("cPhone") as string;
    const cService = fd.get("cService") as string;
    const cPrice = fd.get("cPrice") as string;

    const guestName = cName?.trim() || (locale === "ru" ? "Клиент" : "Client");
    const guestPhone = cPhone?.trim() || "—";
    
    let serviceName = cService?.trim() || (locale === "ru" ? "Услуга" : "Service");
    if (!isCustomService && selectedServiceIds.length === 1) {
      const selectedSrv = services.find(s => s.id === selectedServiceIds[0]);
      if (selectedSrv) {
        serviceName = locale === "ru" ? selectedSrv.nameRu : (locale === "hy" ? selectedSrv.nameHy : selectedSrv.nameEn);
      }
    }
    
    const price = Number(cPrice) || 0;

    try {
      const res = await fetch("/api/admin/barber-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingBookingId ? "editManualBooking" : "createManualBooking",
          bookingId: editingBookingId,
          date: bookingDate,
          startTime: bookingTime,
          durationMinutes: bookingDuration,
          guestName,
          guestPhone,
          serviceId: !isCustomService && selectedServiceIds.length === 1 ? selectedServiceIds[0] : null,
          serviceName,
          price
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert((locale === "ru" ? "Ошибка: " : "Error: ") + (errData.error || "Failed to create booking"));
        return;
      }

      setIsManualBookingOpen(false);
      fetchData(selectedDate, true);
    } catch (e) {
      alert(locale === "ru" ? "Ошибка сети" : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const bookedSlots = daySlots.filter(s => s.status !== "AVAILABLE");
  const timeToMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const availableSlots = daySlots.filter(s => {
    if (s.status !== "AVAILABLE") return false;
    const sStart = timeToMin(s.startTime);
    const sEnd = timeToMin(s.endTime);
    const hasOverlap = bookedSlots.some(b => {
      const bStart = timeToMin(b.startTime);
      const bEnd = timeToMin(b.endTime);
      return bStart < sEnd && bEnd > sStart;
    });
    return !hasOverlap;
  });

  const openFormForEdit = (task: any) => {
    setEditingBookingId(task.id);
    setBookingDate(selectedDate);
    setBookingTime(task.startTime);
    setBookingDuration(task.totalDurationMinutes);
    setGuestName(task.guestName);
    setGuestPhone(task.guestPhone);
    if (task.items && task.items[0]) {
      const item = task.items[0];
      if (item.serviceId) {
        setIsCustomService(false);
        setSelectedServiceIds([item.serviceId]);
        setCustomServiceName("");
        setCustomServicePrice("");
      } else {
        setIsCustomService(true);
        setSelectedServiceIds([]);
        setCustomServiceName(item.nameSnapshot);
        setCustomServicePrice(String(item.priceSnapshotMinor / 100));
      }
      setDefaultPrice(String(item.priceSnapshotMinor / 100));
    }
    setIsManualBookingOpen(true);
  };

  const openForm = (time: string = "") => {
    setEditingBookingId(null);
    setBookingDate(selectedDate);
    setGuestName("");
    setGuestPhone("+374 ");
    setCustomServiceName("");
    setCustomServicePrice("");
    setBookingTime(time);
    setSelectedServiceIds([]);
    setIsCustomService(false);
    setBookingDuration(0);
    setDefaultPrice("0");
    setIsManualBookingOpen(true);
    if (formRef.current) formRef.current.reset();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#14161f] overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-4 pb-20 pt-4 px-4 sm:px-6 min-h-screen">
        <div className="mb-2">
          <Link href="/admin/analytics" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" />
            {locale === "ru" ? "В основную админку" : "To Main Admin"}
          </Link>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {openDays.map(d => {
            const isSelected = d.date === selectedDate;
            const dt = new Date(d.date);
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDate(d.date)}
                className={`min-w-[60px] p-2 rounded-xl flex flex-col items-center justify-center border transition-all ${isSelected ? "bg-blue-500/20 border-blue-400 scale-105" : "bg-surface border-white/10"}`}
              >
                <span className={`text-[10px] uppercase font-bold ${isSelected ? "text-blue-300" : "text-muted"}`}>{dt.toLocaleDateString(locale === "ru" ? "ru" : "en", { weekday: "short" })}</span>
                <span className="text-lg font-bold text-foreground my-0.5">{dt.getDate()}</span>
                <span className="text-[9px] uppercase text-muted">{dt.toLocaleDateString(locale === "ru" ? "ru" : "en", { month: "short" })}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-surface/80 border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col min-h-[50vh]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">{new Date(selectedDate).toLocaleDateString(locale === "ru" ? "ru" : "en", { weekday: "long", day: "numeric", month: "long" })}</h2>
              {isDayOpen ? <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">ОТКРЫТ</span> : <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">ЗАКРЫТ</span>}
            </div>
          </div>

          <div className="flex-1">
            {isLoading ? <div className="py-10 flex justify-center"><LoadingSpinner size="sm" /></div> : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {dayBookings.filter(b => b.status !== "CANCELLED").map(task => {
                    const isDone = task.status === "COMPLETED";
                    return (
                      <SwipeBooking onEdit={openFormForEdit} 
                        key={task.id} 
                        task={task} 
                        isDone={isDone} 
                        locale={locale} 
                        onToggleTask={handleToggleTask} 
                        onDelete={async (bookingId: string, force: boolean) => {
                          if (!force && !confirm(locale === "ru" ? "Удалить запись?" : "Delete booking?")) return;
                          try {
                            if (task.slots && task.slots[0]) {
                              await fetch("/api/admin/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteSlot", slotId: task.slots[0].id }) });
                            }
                            await fetch("/api/admin/barber-calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancelBooking", bookingId }) });
                            fetchData(selectedDate, true);
                          } catch {}
                        }}
                      />
                    );
                  })}
                </div>

                {availableSlots.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    
                    <h4 className="text-xs text-muted mb-2 font-bold uppercase">{locale === "ru" ? "Свободные часы" : "Free Hours"} ({availableSlots.length})</h4>
                    <div className="space-y-4">
                      {/* Morning */}
                      {availableSlots.some(s => s.startTime < "12:00") && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold tracking-wider">
                            <Sunrise className="w-3.5 h-3.5" />
                            {locale === "ru" ? "УТРО" : locale === "hy" ? "ԱՌԱՎՈՏ" : "MORNING"}
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableSlots.filter(s => s.startTime < "12:00").map(slot => (
                              <div key={slot.id} className="relative group">
                                <button onClick={() => openForm(slot.startTime)} className="w-full p-2 bg-[#141418] border border-white/10 rounded-lg text-xs font-mono text-center hover:border-blue-400 hover:text-blue-300 transition-colors">
                                  {slot.startTime}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Afternoon */}
                      {availableSlots.some(s => s.startTime >= "12:00" && s.startTime < "17:00") && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold tracking-wider">
                            <Sun className="w-3.5 h-3.5" />
                            {locale === "ru" ? "ДЕНЬ" : locale === "hy" ? "ԿԵՍՕՐ" : "AFTERNOON"}
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableSlots.filter(s => s.startTime >= "12:00" && s.startTime < "17:00").map(slot => (
                              <div key={slot.id} className="relative group">
                                <button onClick={() => openForm(slot.startTime)} className="w-full p-2 bg-[#141418] border border-white/10 rounded-lg text-xs font-mono text-center hover:border-blue-400 hover:text-blue-300 transition-colors">
                                  {slot.startTime}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Evening */}
                      {availableSlots.some(s => s.startTime >= "17:00") && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold tracking-wider">
                            <Moon className="w-3.5 h-3.5" />
                            {locale === "ru" ? "ВЕЧЕР" : locale === "hy" ? "ԵՐԵԿՈ" : "EVENING"}
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {availableSlots.filter(s => s.startTime >= "17:00").map(slot => (
                              <div key={slot.id} className="relative group">
                                <button onClick={() => openForm(slot.startTime)} className="w-full p-2 bg-[#141418] border border-white/10 rounded-lg text-xs font-mono text-center hover:border-blue-400 hover:text-blue-300 transition-colors">
                                  {slot.startTime}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons moved to the bottom */}
          
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:flex-wrap gap-2 shrink-0">
            <Button variant="primary" size="lg" onClick={() => openForm()} className="w-full sm:flex-1 gap-2 font-bold shadow-[0_4px_25px_rgba(255,255,255,0.1)]"><Plus className="w-4 h-4" /> {t.barberCalendar.addClient || (locale === "ru" ? "Записать клиента" : "Book Client")}</Button>
            <Button variant="outline" size="lg" onClick={handleAddOpenSlot} className="w-full sm:w-auto px-6 border-white/20 hover:bg-white/5 font-bold"><Plus className="w-4 h-4 mr-2" /> {locale === "ru" ? "Открыть час" : "Open Hour"}</Button>
            <Button variant="outline" size="lg" onClick={handleBlockRange} className="w-full sm:w-auto px-6 border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold"><Trash2 className="w-4 h-4 mr-2" /> {locale === "ru" ? "Закрыть время" : "Block Range"}</Button>
            {isDayOpen ? (

              <Button variant="danger" size="lg" onClick={() => handleToggleDay(false)} className="w-full sm:w-auto px-6">{locale === "ru" ? "Закрыть день" : "Close Day"}</Button>
            ) : (
              <Button variant="primary" size="lg" onClick={() => handleToggleDay(true)} className="w-full sm:w-auto px-6">{locale === "ru" ? "Открыть день" : "Open Day"}</Button>
            )}
          </div>
        </div>

        {/* Permanently rendered, CSS-toggled Modal for INSTANT loading */}
        <div className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-150 ${isManualBookingOpen ? "z-[100] opacity-100 pointer-events-auto bg-black/60 backdrop-blur-sm" : "z-[-1] opacity-0 pointer-events-none bg-black/0"}`}>
          <div className={`relative w-full max-w-md max-h-[95vh] overflow-y-auto bg-[#1d202c]/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/[0.09] shadow-[0_12px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] transition-transform duration-200 ${isManualBookingOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}`}>
            <button type="button" onClick={() => setIsManualBookingOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors"><X className="w-4 h-4" /></button>

            <h3 className="text-lg font-bold text-white mb-4 pr-8">{t.barberCalendar.addClient || (locale === "ru" ? "Записать клиента" : "Book Client")}</h3>

            <form ref={formRef} onSubmit={onSubmitBooking} className="space-y-3">
              <div className="space-y-2">
                <input type="date" required value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="w-full bg-[#16161c]/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-[16px] text-white focus:border-blue-400 outline-none transition-colors" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="time" required value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="w-full bg-[#16161c]/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-[16px] text-white focus:border-blue-400 outline-none transition-colors" />
                <select required value={bookingDuration} onChange={e => setBookingDuration(Number(e.target.value))} className="w-full bg-[#16161c]/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-[16px] text-white focus:border-blue-400 outline-none transition-colors">
                  <option value={0} disabled>{locale === "ru" ? "Длительность" : "Duration"}</option>
                  <option value={15}>15 {locale === "ru" ? "мин" : "min"}</option>
                  <option value={30}>30 {locale === "ru" ? "мин" : "min"}</option>
                  <option value={45}>45 {locale === "ru" ? "мин" : "min"}</option>
                  <option value={60}>60 {locale === "ru" ? "мин" : "min"}</option>
                  <option value={90}>90 {locale === "ru" ? "мин" : "min"}</option>
                  <option value={120}>120 {locale === "ru" ? "мин" : "min"}</option>
                </select>
              </div>
            </div>

              
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto no-scrollbar border border-white/10 rounded-lg p-2 bg-[#16161c]/50">
                <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5 transition-colors">
                  <input type="checkbox" checked={isCustomService} onChange={toggleCustom} className="w-4 h-4 rounded border-white/20 bg-black/20 text-blue-500 focus:ring-0 focus:ring-offset-0" />
                  <span className="text-[16px] text-white font-medium">{locale === "ru" ? "Своя услуга" : "Custom Service"}</span>
                </label>
                {!isCustomService && services.map(s => (
                  <label key={s.id} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="checkbox" checked={selectedServiceIds.includes(s.id)} onChange={() => toggleService(s.id)} className="w-4 h-4 rounded border-white/20 bg-black/20 text-blue-500 focus:ring-0 focus:ring-offset-0" />
                    <div className="flex flex-col">
                      <span className="text-[16px] text-white font-medium">{locale === "ru" ? s.nameRu : (locale === "hy" ? s.nameHy : s.nameEn)}</span>
                      <span className="text-[10px] text-muted">{s.durationMinutes} {locale === "ru" ? "мин" : "min"} • {Math.round(s.priceMinorUnits/100)} AMD</span>
                    </div>
                  </label>
                ))}
              </div>


              {isCustomService && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-150">
                  <input name="cService" type="text" value={customServiceName} onChange={e => setCustomServiceName(e.target.value)} placeholder={locale === "ru" ? "Название" : "Name"} className="w-full bg-[#16161c]/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-[16px] text-white focus:border-blue-400 outline-none transition-colors" />
                  <input name="cPrice" type="number" value={customServicePrice} onChange={e => setCustomServicePrice(e.target.value)} placeholder={locale === "ru" ? "Цена" : "Price"} className="w-full bg-[#16161c]/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-[16px] text-white focus:border-blue-400 outline-none transition-colors" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <input name="cName" type="text" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={locale === "ru" ? "Имя" : "Name"} className="w-full bg-[#16161c]/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-[16px] text-white focus:border-blue-400 outline-none transition-colors" />
                <input name="cPhone" type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder={locale === "ru" ? "Телефон" : "Phone"} className="w-full bg-[#16161c]/50 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-[16px] text-white focus:border-blue-400 outline-none transition-colors" />
              </div>

              {!isCustomService && selectedServiceIds.length > 0 && <input type="hidden" name="cPrice" value={defaultPrice} />}

              <div className="pt-2">
                <Button variant="primary" type="submit" isLoading={isSubmitting} className="w-full py-2.5 text-sm font-bold shadow-[0_4px_25px_rgba(255,255,255,0.1)]">
                  {t.barberCalendar.addClient || (locale === "ru" ? "Записать" : "Book")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}