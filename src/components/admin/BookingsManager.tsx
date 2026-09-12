"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { formatCurrency } from "@/lib/timezone";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, UserX, Search, RefreshCw, Clock, Check, Send, BarChart3 } from "lucide-react";

export interface BookingAdminItem {
  id: string;
  bookingNumber: string;
  guestName: string;
  guestPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  totalDurationMinutes: number;
  totalPriceMinorUnits: number;
  status: "CONFIRMED" | "PENDING_VERIFICATION" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  items: {
    nameSnapshot: string;
  }[];
}

export function BookingsManager() {
  const { t, locale } = useAdminI18n();
  const [bookings, setBookings] = useState<BookingAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string>("");

  // Cooldown setting state
  const [cooldownHours, setCooldownHours] = useState<number>(3);
  const [customCooldownInput, setCustomCooldownInput] = useState<string>("3");
  const [isSavingCooldown, setIsSavingCooldown] = useState(false);
  const [cooldownSaved, setCooldownSaved] = useState(false);

  // Telegram Bot State
  const [telegramChatId, setTelegramChatId] = useState<string>("");
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isTesting30Min, setIsTesting30Min] = useState(false);
  const [isTestingDailyReport, setIsTestingDailyReport] = useState(false);
  const [telegramStatusMsg, setTelegramStatusMsg] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/settings/cooldown")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.cooldownHours === "number") {
          setCooldownHours(data.cooldownHours);
          setCustomCooldownInput(String(data.cooldownHours));
        }
      })
      .catch(() => {});

    fetch("/api/admin/settings/telegram")
      .then((res) => res.json())
      .then((data) => {
        if (data.chatId) setTelegramChatId(data.chatId);
      })
      .catch(() => {});

    // Periodic check for 30-min reminders every 60s
    const runReminderCheck = () => {
      fetch("/api/admin/reminders")
        .catch(() => {});
    };
    runReminderCheck();
    const interval = setInterval(runReminderCheck, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleTest30MinReminder = async () => {
    setIsTesting30Min(true);
    setTelegramStatusMsg("");
    try {
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTelegramStatusMsg("✅ 30 րոպեի հիշեցումը (30-мин напоминание) հաջողությամբ ուղարկվեց Telegram!");
      } else {
        setTelegramStatusMsg(`❌ ${data.error || "Ошибка отправки"}`);
      }
    } catch {
      setTelegramStatusMsg("❌ Ошибка соединения");
    } finally {
      setIsTesting30Min(false);
    }
  };

  const handleTestDailyReport = async () => {
    setIsTestingDailyReport(true);
    setTelegramStatusMsg("");
    try {
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_daily_report" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTelegramStatusMsg(`✅ Օրվա ամփոփումը (23:59 հաշվետվություն) հաջողությամբ ուղարկվեց Telegram! (Եկամուտ՝ ${data.todayRevenue?.toLocaleString("hy-AM")} ֏, Վաղվա գրանցումներ՝ ${data.tomorrowCount})`);
      } else {
        setTelegramStatusMsg(`❌ ${data.error || data.reason || "Ошибка отправки отчета"}`);
      }
    } catch {
      setTelegramStatusMsg("❌ Ошибка соединения");
    } finally {
      setIsTestingDailyReport(false);
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    setTelegramStatusMsg("");
    try {
      const res = await fetch("/api/admin/settings/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testMessage: true, chatId: telegramChatId }),
      });
      const data = await res.json();
      if (res.ok) {
        setTelegramStatusMsg("✅ Тестовое сообщение отправлено в @barberGag_bot!");
        if (data.chatId) setTelegramChatId(data.chatId);
      } else {
        setTelegramStatusMsg(`❌ ${data.error || "Ошибка"}`);
      }
    } catch {
      setTelegramStatusMsg("❌ Ошибка соединения");
    } finally {
      setIsTestingTelegram(false);
    }
  };

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

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (dateFilter) params.append("date", dateFilter);
      if (searchFilter) params.append("search", searchFilter);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.bookings) setBookings(data.bookings);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, dateFilter, searchFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleUpdateStatus = async (bookingId: string, targetStatus: string) => {
    setActionLoadingId(bookingId);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: targetStatus }),
      });
      if (res.ok) fetchBookings();
    } catch {
      // ignore
    } finally {
      setActionLoadingId("");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING_VERIFICATION":
        return t.bookings.statusPending;
      case "CONFIRMED":
        return t.bookings.statusConfirmed;
      case "COMPLETED":
        return t.bookings.statusCompleted;
      case "CANCELLED":
        return t.bookings.statusCancelled;
      case "NO_SHOW":
        return "No Show";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-semibold">
            {t.dashboard.executiveOverview}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1 uppercase">
            {t.bookings.title}
          </h1>
        </div>

        <Button size="sm" variant="outline" onClick={fetchBookings} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t.common.refresh}</span>
        </Button>
      </div>

      {/* Cancellation Cooldown Control Card */}
      <div className="bg-[#1d202c]/75 backdrop-blur-2xl border border-white/[0.09] rounded-3xl p-6 shadow-[0_12px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/25 text-accent flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(197,168,128,0.15)]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {locale === "hy"
                  ? "Չեղարկումից հետո արգելափակման ժամանակ"
                  : locale === "ru"
                  ? "Блокировка повторной записи после отмены"
                  : "Post-Cancellation Booking Cooldown"}
              </h3>
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
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                <Check className="w-3.5 h-3.5" />
                {locale === "ru" ? "Сохранено" : locale === "hy" ? "Պահպանված է" : "Saved"}
              </span>
            )}
          </div>
        </div>

        {/* Quick select buttons and custom input */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {[0, 1, 2, 3, 6, 12, 24].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => handleSaveCooldown(hours)}
                disabled={isSavingCooldown}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border ${
                  cooldownHours === hours
                    ? "bg-accent text-accent-foreground border-accent font-bold shadow-[0_2px_15px_rgba(197,168,128,0.35)] hover:-translate-y-0.5"
                    : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/[0.06]"
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

          <div className="flex items-center space-x-2 bg-white/[0.03] border border-white/10 rounded-full px-3 py-1 shadow-inner">
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
              className="px-3 py-1 bg-accent/20 hover:bg-accent text-accent hover:text-accent-foreground rounded-full text-[11px] font-mono font-medium transition-all"
            >
              {locale === "ru" ? "Задать" : locale === "hy" ? "Պահպանել" : "Set"}
            </button>
          </div>
        </div>
      </div>

      {/* Telegram Bot Notification Card */}
      <div className="bg-[#1d202c]/75 backdrop-blur-2xl border border-white/[0.09] rounded-3xl p-6 shadow-[0_12px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-foreground">
                  Telegram Оповещения (@barberGag_bot)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  LIVE BOT
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Оповещения о бронированиях и автоматические напоминания <b>за 30 минут до приезда клиента</b> (Имя, услуга, номер).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isTesting30Min}
              onClick={handleTest30MinReminder}
              className="gap-2 rounded-full border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/50"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isTesting30Min ? "Отправка..." : "Тест 30-мин напоминания"}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={isTestingDailyReport}
              onClick={handleTestDailyReport}
              className="gap-2 rounded-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/50"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isTestingDailyReport ? "Отправка..." : "Тест 23:59 отчета"}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={isTestingTelegram}
              onClick={handleTestTelegram}
              className="gap-2 rounded-full border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTestingTelegram ? "Отправка..." : "Тест Telegram"}</span>
            </Button>
          </div>
        </div>

        {telegramStatusMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-mono border backdrop-blur-md ${
              telegramStatusMsg.startsWith("✅")
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                : "bg-rose-950/30 border-rose-500/30 text-rose-300"
            }`}
          >
            {telegramStatusMsg}
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-[#1d202c]/75 border border-white/[0.09] backdrop-blur-xl rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-lg">
        <div>
          <label className="block text-[10px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
            {t.common.status}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-accent rounded-2xl px-4 py-2.5 text-xs font-mono text-foreground focus:outline-none transition-all"
          >
            <option value="ALL" className="bg-[#16161a] text-white">{t.bookings.allTab}</option>
            <option value="CONFIRMED" className="bg-[#16161a] text-white">{t.bookings.confirmedTab}</option>
            <option value="PENDING_VERIFICATION" className="bg-[#16161a] text-white">{t.bookings.pendingTab}</option>
            <option value="COMPLETED" className="bg-[#16161a] text-white">{t.bookings.completedTab}</option>
            <option value="CANCELLED" className="bg-[#16161a] text-white">{t.bookings.cancelledTab}</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
            {t.bookings.dateTime}
          </label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-accent focus:ring-1 focus:ring-accent/30 rounded-2xl px-4 py-2.5 text-xs font-mono text-white transition-all [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
            {t.common.search}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. +374 / BK-..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-accent focus:ring-1 focus:ring-accent/30 rounded-2xl px-4 py-2.5 text-xs font-mono text-white transition-all placeholder:text-muted/50 pr-9"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute right-3.5 top-3" />
          </div>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="bg-[#1d202c]/75 border border-white/[0.09] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_12px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        {isLoading ? (
          <div className="py-14 text-center text-xs font-mono text-muted animate-pulse">{t.common.loading}</div>
        ) : bookings.length === 0 ? (
          <div className="py-14 text-center text-xs font-mono text-muted">
            {t.bookings.noBookingsFound}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">{t.bookings.bookingNumber}</th>
                  <th className="py-3 px-3">{t.bookings.customer}</th>
                  <th className="py-3 px-3">{t.bookings.dateTime}</th>
                  <th className="py-3 px-3">{t.bookings.serviceAndAddons}</th>
                  <th className="py-3 px-3">{t.bookings.totalPrice}</th>
                  <th className="py-3 px-3">{t.bookings.status}</th>
                  <th className="py-3 px-3 text-right">{t.bookings.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {bookings.map((b) => {
                  const isActionLoading = actionLoadingId === b.id;
                  return (
                    <tr key={b.id} className="hover:bg-white/[0.03] transition-colors rounded-2xl">
                      <td className="py-4 px-3 font-bold text-accent">{b.bookingNumber}</td>
                      <td className="py-4 px-3">
                        <span className="font-sans font-medium text-foreground block">{b.guestName}</span>
                        <span className="text-[10px] text-zinc-400">{b.guestPhone}</span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-foreground block">{b.date}</span>
                        <span className="text-[10px] text-accent font-semibold">{b.startTime} - {b.endTime}</span>
                      </td>
                      <td className="py-4 px-3 font-sans text-zinc-400 max-w-[200px] truncate">
                        {b.items.map((i) => i.nameSnapshot).join(", ")}
                      </td>
                      <td className="py-4 px-3 text-accent font-bold">
                        {formatCurrency(b.totalPriceMinorUnits, locale)}
                      </td>
                      <td className="py-4 px-3">
                        <Badge
                          variant={
                            b.status === "CONFIRMED"
                              ? "gold"
                              : b.status === "COMPLETED"
                              ? "green"
                              : b.status === "CANCELLED"
                              ? "red"
                              : "gray"
                          }
                        >
                          {getStatusLabel(b.status)}
                        </Badge>
                      </td>
                      <td className="py-4 px-3 text-right space-x-1.5">
                        {b.status === "CONFIRMED" && (
                          <>
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                              title={t.bookings.markCompleted}
                              className="p-2 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500/50 shadow-sm transition-all duration-200"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                              title={t.bookings.markCancelled}
                              className="p-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/50 shadow-sm transition-all duration-200"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

