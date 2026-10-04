"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Plus, Check, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function BarberCalendarManager() {
  const { t, locale } = useAdminI18n();
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const hasFetchedFullDays = useRef(false);

  const [openDays, setOpenDays] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [dayBookings, setDayBookings] = useState<any[]>([]);
  const [daySlots, setDaySlots] = useState<any[]>([]);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [bookingTime, setBookingTime] = useState("12:00");
  const [bookingDuration, setBookingDuration] = useState(60);
  const [selectedServiceId, setSelectedServiceId] = useState("CUSTOM");
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
    } catch {} finally {
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
    } catch {}
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
    } catch {}
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

  const handleServiceChange = (e: any) => {
    const val = e.target.value;
    setSelectedServiceId(val);
    const srv = services.find(s => s.id === val);
    if (srv) {
      setBookingDuration(srv.durationMinutes);
      setDefaultPrice(String(Math.round(srv.priceMinorUnits / 100)));
    }
  };

  const onSubmitBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const cName = fd.get("cName") as string;
    const cPhone = fd.get("cPhone") as string;
    const cService = fd.get("cService") as string;
    const cPrice = fd.get("cPrice") as string;

    const guestName = cName?.trim() || (locale === "ru" ? "Клиент" : "Client");
    const guestPhone = cPhone?.trim() || "—";
    const serviceName = cService?.trim() || (locale === "ru" ? "Услуга" : "Service");
    const price = Number(cPrice) || 0;

    try {
      const res = await fetch("/api/admin/barber-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createManualBooking",
          date: selectedDate,
          startTime: bookingTime,
          durationMinutes: bookingDuration,
          guestName,
          guestPhone,
          serviceId: selectedServiceId || null,
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

  const availableSlots = daySlots.filter(s => s.status === "AVAILABLE");

  const openForm = (time: string = "12:00") => {
    setBookingTime(time);
    setSelectedServiceId("CUSTOM");
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
              className={`min-w-[60px] p-2 rounded-xl flex flex-col items-center justify-center border transition-all ${isSelected ? "bg-accent/20 border-accent scale-105" : "bg-surface border-white/10"}`}
            >
              <span className={`text-[10px] uppercase font-bold ${isSelected ? "text-accent" : "text-muted"}`}>{dt.toLocaleDateString(locale==="ru"?"ru":"en",{weekday:"short"})}</span>
              <span className="text-lg font-bold text-foreground my-0.5">{dt.getDate()}</span>
              <span className="text-[9px] uppercase text-muted">{dt.toLocaleDateString(locale==="ru"?"ru":"en",{month:"short"})}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-surface/80 border border-white/10 rounded-2xl p-4 shadow-lg flex flex-col min-h-[50vh]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">{new Date(selectedDate).toLocaleDateString(locale==="ru"?"ru":"en",{weekday:"long", day:"numeric", month:"long"})}</h2>
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
                    <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDone ? "bg-emerald-950/20 border-emerald-500/20 opacity-70" : "bg-background/80 border-white/10"}`}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleToggleTask(task)} className={`w-6 h-6 rounded flex items-center justify-center border ${isDone ? "bg-emerald-500 border-emerald-500 text-black" : "border-white/30"}`}>
                          <Check className="w-4 h-4" />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-accent">{task.startTime}-{task.endTime}</span>
                            <span className={`text-sm font-bold ${isDone?"line-through text-muted":"text-white"}`}>{task.guestName}</span>
                          </div>
                          <div className="text-[10px] text-muted font-mono">{task.guestPhone} • {task.items.map((i:any)=>i.nameSnapshot).join("+")}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {availableSlots.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <h4 className="text-xs text-muted mb-2 font-bold uppercase">{locale==="ru"?"Свободные часы":"Free Hours"} ({availableSlots.length})</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <div key={slot.id} className="relative group">
                        <button onClick={() => openForm(slot.startTime)} className="w-full p-2 bg-[#141418] border border-white/10 rounded-lg text-xs font-mono text-center hover:border-accent hover:text-accent transition-colors">
                          {slot.startTime}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons moved to the bottom */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2 shrink-0">
          <Button variant="primary" size="lg" onClick={() => openForm()} className="w-full sm:flex-1 gap-2 font-bold shadow-[0_0_20px_rgba(197,168,128,0.2)]"><Plus className="w-4 h-4"/> {t.barberCalendar.addClient || (locale==="ru"?"Записать клиента":"Book Client")}</Button>
          {isDayOpen ? (
            <Button variant="danger" size="lg" onClick={() => handleToggleDay(false)} className="w-full sm:w-auto px-6">{locale==="ru"?"Закрыть день":"Close Day"}</Button>
          ) : (
            <Button variant="primary" size="lg" onClick={() => handleToggleDay(true)} className="w-full sm:w-auto px-6">{locale==="ru"?"Открыть день":"Open Day"}</Button>
          )}
        </div>
      </div>

      {/* Permanently rendered, CSS-toggled Modal for INSTANT loading */}
      <div className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-150 ${isManualBookingOpen ? "z-50 opacity-100 pointer-events-auto bg-black/85" : "z-[-1] opacity-0 pointer-events-none bg-black/0"}`}>
        <div className={`relative w-full max-w-md max-h-[95vh] overflow-y-auto bg-[#1c1f2b] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-2xl transition-transform duration-200 ${isManualBookingOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"}`}>
          <button type="button" onClick={() => setIsManualBookingOpen(false)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors"><X className="w-4 h-4"/></button>
          
          <h3 className="text-lg font-bold text-white mb-4 pr-8">{t.barberCalendar.addClient || (locale==="ru"?"Записать клиента":"Book Client")}</h3>
          
          <form ref={formRef} onSubmit={onSubmitBooking} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input type="time" required value={bookingTime} onChange={e=>setBookingTime(e.target.value)} className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none" />
              <select value={bookingDuration} onChange={e=>setBookingDuration(Number(e.target.value))} className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none">
                <option value={30}>30 {locale==="ru"?"мин":"min"}</option>
                <option value={45}>45 {locale==="ru"?"мин":"min"}</option>
                <option value={60}>60 {locale==="ru"?"мин":"min"}</option>
                <option value={90}>90 {locale==="ru"?"мин":"min"}</option>
              </select>
            </div>
            
            <select value={selectedServiceId} onChange={handleServiceChange} className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none">
              <option value="">— {locale==="ru"?"Услуга":"Service"} —</option>
              <option value="CUSTOM">{locale==="ru"?"Своя услуга":"Custom Service"}</option>
              {services.map(s => <option key={s.id} value={s.id}>{locale==="ru"?s.nameRu:(locale==="hy"?s.nameHy:s.nameEn)}</option>)}
            </select>
            
            {selectedServiceId === "CUSTOM" && (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-150">
                <input name="cService" type="text" placeholder={locale==="ru"?"Название":"Name"} className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none" />
                <input name="cPrice" type="number" placeholder={locale==="ru"?"Цена":"Price"} className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none" />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 pt-1">
              <input name="cName" type="text" placeholder={locale==="ru"?"Имя":"Name"} className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none" />
              <input name="cPhone" type="tel" placeholder={locale==="ru"?"Телефон":"Phone"} defaultValue="+374 " className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none" />
            </div>
            
            {selectedServiceId !== "CUSTOM" && selectedServiceId !== "" && <input type="hidden" name="cPrice" value={defaultPrice} />}
            
            <div className="pt-2">
              <Button variant="primary" type="submit" isLoading={isSubmitting} className="w-full py-2.5 text-sm font-bold shadow-[0_0_15px_rgba(197,168,128,0.2)]">
                {t.barberCalendar.addClient || (locale==="ru"?"Записать":"Book")}
              </Button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}