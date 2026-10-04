"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Plus, Clock, User, Phone, Check, X } from "lucide-react";

export function BarberCalendarManager() {
  const { t, locale } = useAdminI18n();
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [openDays, setOpenDays] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [dayBookings, setDayBookings] = useState<any[]>([]);
  const [daySlots, setDaySlots] = useState<any[]>([]);
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [bookingTime, setBookingTime] = useState("12:00");
  const [bookingDuration, setBookingDuration] = useState(60);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("0");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/barber-calendar?date=${date}`);
      if (!res.ok) throw new Error("");
      const data = await res.json();
      setOpenDays(data.openDays || []);
      setServices(data.services || []);
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
      fetchData(selectedDate);
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
      fetchData(selectedDate);
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
      fetchData(selectedDate);
    } catch { fetchData(selectedDate); }
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

    const guestName = cName?.trim() || "Клиент";
    const guestPhone = cPhone?.trim() || "—";
    const serviceName = cService?.trim() || "Услуга";
    const price = Number(cPrice) || 0;

    try {
      await fetch("/api/admin/barber-calendar", {
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
      setIsManualBookingOpen(false);
      fetchData(selectedDate);
    } catch {} finally {
      setIsSubmitting(false);
    }
  };

  const availableSlots = daySlots.filter(s => s.status === "AVAILABLE");

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
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

      <div className="bg-surface/80 border border-white/10 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">{new Date(selectedDate).toLocaleDateString(locale==="ru"?"ru":"en",{weekday:"long", day:"numeric", month:"long"})}</h2>
            {isDayOpen ? <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">ОТКРЫТ</span> : <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded">ЗАКРЫТ</span>}
          </div>
          <div className="flex gap-2">
            {isDayOpen ? (
              <Button variant="danger" size="sm" onClick={() => handleToggleDay(false)} className="h-8 text-xs px-3">{locale==="ru"?"Закрыть день":"Close Day"}</Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => handleToggleDay(true)} className="h-8 text-xs px-3">{locale==="ru"?"Открыть день":"Open Day"}</Button>
            )}
            <Button variant="primary" size="sm" onClick={() => setIsManualBookingOpen(true)} className="h-8 text-xs px-3 gap-1"><Plus className="w-3.5 h-3.5"/> {t.barberCalendar.addClient || (locale==="ru"?"Запись":"Book")}</Button>
          </div>
        </div>

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
                <h4 className="text-xs text-muted mb-2 font-bold uppercase">Свободные часы ({availableSlots.length})</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map(slot => (
                    <div key={slot.id} className="relative group">
                      <button onClick={() => { setBookingTime(slot.startTime); setIsManualBookingOpen(true); }} className="w-full p-2 bg-[#141418] border border-white/10 rounded-lg text-xs font-mono text-center hover:border-accent hover:text-accent">
                        {slot.startTime}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isManualBookingOpen} onClose={() => setIsManualBookingOpen(false)} title={t.barberCalendar.addClient || (locale==="ru"?"Записать клиента":"Book Client")}>
        <form onSubmit={onSubmitBooking} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input type="time" required value={bookingTime} onChange={e=>setBookingTime(e.target.value)} className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white" />
            <select value={bookingDuration} onChange={e=>setBookingDuration(Number(e.target.value))} className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white">
              <option value={30}>30 мин</option><option value={45}>45 мин</option><option value={60}>60 мин</option><option value={90}>90 мин</option>
            </select>
          </div>
          <select value={selectedServiceId} onChange={handleServiceChange} className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white">
            <option value="">— {locale==="ru"?"Услуга":"Service"} —</option>
            <option value="CUSTOM">{locale==="ru"?"Своя услуга":"Custom Service"}</option>
            {services.map(s => <option key={s.id} value={s.id}>{locale==="ru"?s.nameRu:(locale==="hy"?s.nameHy:s.nameEn)}</option>)}
          </select>
          {selectedServiceId === "CUSTOM" && (
            <div className="grid grid-cols-2 gap-2">
              <input name="cService" type="text" placeholder="Название" className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white" />
              <input name="cPrice" type="number" placeholder="Цена" className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input name="cName" type="text" placeholder="Имя" className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white" />
            <input name="cPhone" type="tel" placeholder="Телефон" defaultValue="+374 " className="w-full bg-[#16161c] border border-white/20 rounded-lg px-3 py-2 text-xs text-white" />
          </div>
          {selectedServiceId !== "CUSTOM" && selectedServiceId !== "" && <input type="hidden" name="cPrice" value={defaultPrice} />}
          <Button variant="primary" type="submit" isLoading={isSubmitting} className="w-full mt-2 py-2">{t.barberCalendar.addClient || (locale==="ru"?"Записать":"Book")}</Button>
        </form>
      </Modal>
    </div>
  );
}
