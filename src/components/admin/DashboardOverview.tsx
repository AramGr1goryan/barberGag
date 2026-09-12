"use client";

import React from "react";
import Link from "next/link";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { formatCurrency } from "@/lib/timezone";
import { Badge } from "@/components/ui/Badge";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PhoneCall,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";

export interface DashboardMetricsProps {
  metrics: {
    todayBookings: number;
    upcomingBookings: number;
    availableSlotsCount: number;
    newCallbacksCount: number;
    confirmedCount: number;
    pendingCount: number;
    cancelledCount: number;
    totalCustomersCount: number;
    recentBookings: Array<{
      id: string;
      bookingNumber: string;
      guestName: string;
      guestPhone: string;
      date: string;
      startTime: string;
      totalPriceMinorUnits: number;
      status: string;
    }>;
  };
}

export function DashboardOverview({ metrics }: DashboardMetricsProps) {
  const { t, locale } = useAdminI18n();

  const cards = [
    {
      title: t.dashboard.todayAppointments,
      value: metrics.todayBookings,
      icon: Calendar,
      color: "text-accent",
      link: "/admin/bookings",
    },
    {
      title: t.dashboard.upcomingAppointments,
      value: metrics.upcomingBookings,
      icon: Clock,
      color: "text-foreground",
      link: "/admin/bookings",
    },
    {
      title: t.dashboard.availableSlots,
      value: metrics.availableSlotsCount,
      icon: CalendarDays,
      color: "text-emerald-400",
      link: "/admin/calendar",
    },
    {
      title: t.dashboard.newCallbacks,
      value: metrics.newCallbacksCount,
      icon: PhoneCall,
      color: "text-amber-400",
      link: "/admin/callbacks",
    },
    {
      title: t.dashboard.confirmedTotal,
      value: metrics.confirmedCount,
      icon: CheckCircle2,
      color: "text-accent",
      link: "/admin/bookings",
    },
    {
      title: t.dashboard.pendingVerification,
      value: metrics.pendingCount,
      icon: AlertTriangle,
      color: "text-yellow-400",
      link: "/admin/bookings",
    },
    {
      title: t.dashboard.cancelledAppointments,
      value: metrics.cancelledCount,
      icon: XCircle,
      color: "text-rose-400",
      link: "/admin/bookings",
    },
    {
      title: t.dashboard.registeredCustomers,
      value: metrics.totalCustomersCount,
      icon: Users,
      color: "text-foreground",
      link: "/admin",
    },
  ];

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
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-accent uppercase font-semibold bg-accent/10 border border-accent/25 shadow-[0_0_15px_rgba(197,168,128,0.12)]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {t.dashboard.executiveOverview}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mt-2 uppercase tracking-wide">
            {t.dashboard.operationsDashboard}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/barber-calendar"
            className="inline-flex items-center space-x-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider shadow-[0_4px_25px_rgba(197,168,128,0.3)] hover:shadow-[0_6px_35px_rgba(197,168,128,0.5)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <Calendar className="w-4 h-4" />
            <span>{t.nav.barberCalendar}</span>
          </Link>

          <Link
            href="/admin/calendar"
            className="inline-flex items-center space-x-2 bg-white/[0.04] text-foreground border border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.08] px-5 py-2.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <CalendarDays className="w-4 h-4 text-accent" />
            <span>{t.dashboard.manageCalendar}</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          // Feature highlight for first two cards in bento layout
          const isFeature = idx === 0 || idx === 1;

          return (
            <Link
              key={idx}
              href={c.link}
              className={`relative rounded-3xl p-6 border transition-all duration-300 group flex flex-col justify-between overflow-hidden ${
                isFeature
                  ? "bg-gradient-to-br from-white/[0.08] via-[#222533]/85 to-[#272b3b]/90 border-white/[0.14] shadow-[0_10px_35px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-accent/40 hover:shadow-[0_15px_45px_rgba(197,168,128,0.15)] hover:-translate-y-1"
                  : "bg-[#1d202c]/75 backdrop-blur-xl border-white/[0.09] shadow-[0_8px_30px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/[0.18] hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:-translate-y-1"
              }`}
            >
              {/* Subtle top edge liquid shine */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  {c.title}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:border-accent/30 group-hover:bg-accent/10 transition-all duration-300">
                  <Icon className={`w-4 h-4 ${c.color} transition-transform duration-300 group-hover:scale-110`} />
                </div>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <span className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                  {c.value}
                </span>
                <div className="w-7 h-7 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:border-accent/30 transition-all duration-300">
                  <ArrowRight className="w-3.5 h-3.5 text-accent" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Bookings Activity Card */}
      <div className="relative rounded-3xl border border-white/[0.09] bg-[#1d202c]/75 backdrop-blur-2xl p-6 sm:p-8 space-y-6 shadow-[0_12px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        {/* Subtle Ambient Liquid Glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide">
              {t.dashboard.todaysSchedule}
            </h3>
          </div>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono text-accent hover:text-accent-hover bg-accent/[0.08] hover:bg-accent/[0.15] border border-accent/20 transition-all duration-200"
          >
            <span>{t.bookings.title}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {metrics.recentBookings.length === 0 ? (
          <p className="text-xs text-muted py-10 text-center font-mono">{t.dashboard.noBookingsToday}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">{t.bookings.bookingNumber}</th>
                  <th className="py-3 px-4">{t.bookings.customer}</th>
                  <th className="py-3 px-4">{t.bookings.phone}</th>
                  <th className="py-3 px-4">{t.bookings.dateTime}</th>
                  <th className="py-3 px-4">{t.dashboard.price}</th>
                  <th className="py-3 px-4">{t.bookings.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {metrics.recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.03] transition-colors rounded-2xl">
                    <td className="py-4 px-4 font-bold text-accent">{b.bookingNumber}</td>
                    <td className="py-4 px-4 text-foreground font-sans font-medium">{b.guestName}</td>
                    <td className="py-4 px-4 text-zinc-400">{b.guestPhone}</td>
                    <td className="py-4 px-4 text-foreground font-medium">
                      {b.date} • {b.startTime}
                    </td>
                    <td className="py-4 px-4 text-accent font-bold">
                      {formatCurrency(b.totalPriceMinorUnits, locale)}
                    </td>
                    <td className="py-4 px-4">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Health / Status */}
      <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] tracking-wider mb-1">
            {t.dashboard.timezone}
          </span>
          <span className="text-foreground font-bold">Asia/Yerevan (GMT+4)</span>
        </div>
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] tracking-wider mb-1">
            {t.dashboard.bookingEngine}
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            {t.dashboard.activeThreeHourRule}
          </span>
        </div>
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] tracking-wider mb-1">
            {t.nav.calendar}
          </span>
          <span className="text-accent font-bold">
            {t.dashboard.closedByDefault}
          </span>
        </div>
      </div>
    </div>
  );
}
