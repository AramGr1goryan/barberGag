"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { formatCurrency } from "@/lib/timezone";
import {
  DateRangeType,
  FullFinancialAnalyticsResponse,
  ServiceFinancialItem,
} from "@/types/financial-analytics";
import { FinancialTrendChart } from "./FinancialTrendChart";
import { WeekdayTimeChart } from "./WeekdayTimeChart";
import {
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Calendar,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  BarChart3,
  Percent,
  Scissors,
  UserCheck,
} from "lucide-react";

export function FinancialAnalyticsDashboard() {
  const { t, locale } = useAdminI18n();

  const [rangeType, setRangeType] = useState<DateRangeType>("30days");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [analytics, setAnalytics] = useState<FullFinancialAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [serviceSortKey, setServiceSortKey] = useState<keyof ServiceFinancialItem>("realizedRevenue");
  const [serviceSortAsc, setServiceSortAsc] = useState<boolean>(false);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("range", rangeType);
      if (rangeType === "custom" && customStartDate && customEndDate) {
        params.set("startDate", customStartDate);
        params.set("endDate", customEndDate);
      }

      const res = await fetch(`/api/admin/analytics/financial?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch financial analytics");
      const data: FullFinancialAnalyticsResponse = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [rangeType, customStartDate, customEndDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("range", rangeType);
      params.set("export", "csv");
      if (rangeType === "custom" && customStartDate && customEndDate) {
        params.set("startDate", customStartDate);
        params.set("endDate", customEndDate);
      }
      window.location.href = `/api/admin/analytics/financial?${params.toString()}`;
    } finally {
      setIsExporting(false);
    }
  };

  const handleServiceSort = (key: keyof ServiceFinancialItem) => {
    if (serviceSortKey === key) {
      setServiceSortAsc(!serviceSortAsc);
    } else {
      setServiceSortKey(key);
      setServiceSortAsc(false);
    }
  };

  const sortedServices = React.useMemo(() => {
    if (!analytics?.services.items) return [];
    return [...analytics.services.items].sort((a, b) => {
      const valA = a[serviceSortKey];
      const valB = b[serviceSortKey];
      if (typeof valA === "number" && typeof valB === "number") {
        return serviceSortAsc ? valA - valB : valB - valA;
      }
      return serviceSortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [analytics?.services.items, serviceSortKey, serviceSortAsc]);

  if (isLoading && !analytics) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-muted">{t.common.loading}</p>
      </div>
    );
  }

  if (!analytics) return null;

  const k = analytics.kpis;
  const fTomorrow = analytics.tomorrowForecast;
  const mEnd = analytics.monthEndForecast;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Executive Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#c5a880]" />
            <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-semibold">
              {t.dashboard.executiveOverview}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-tight">
            {t.analytics.title}
          </h1>
          <p className="text-xs text-muted font-mono mt-1">
            {t.analytics.subtitle} • {t.analytics.actual}:{" "}
            <span className="text-emerald-400 font-semibold">{analytics.totalCompletedRecordsInDatabase} bookings</span>
          </p>
        </div>

        {/* Action Buttons: Refresh & Export */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="px-4 py-2 rounded-full text-xs font-mono text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all flex items-center gap-1.5"
            title={t.common.refresh}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t.common.refresh}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-accent-foreground bg-accent hover:bg-accent-hover transition-all flex items-center gap-1.5 shadow-[0_4px_15px_rgba(197,168,128,0.25)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.analytics.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* 2. Date Range Filter Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#181a24]/90 backdrop-blur-xl rounded-2xl border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "today", label: t.analytics.timeRanges.today },
            { key: "yesterday", label: t.analytics.timeRanges.yesterday },
            { key: "7days", label: t.analytics.timeRanges.sevenDays },
            { key: "30days", label: t.analytics.timeRanges.thirtyDays },
            { key: "month", label: t.analytics.timeRanges.thisMonth },
            { key: "last_month", label: t.analytics.timeRanges.lastMonth },
            { key: "year", label: t.analytics.timeRanges.thisYear },
            { key: "custom", label: t.analytics.timeRanges.custom },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRangeType(tab.key as DateRangeType)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
                rangeType === tab.key
                  ? "bg-accent text-accent-foreground font-bold shadow-[0_2px_10px_rgba(197,168,128,0.25)]"
                  : "text-muted hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {rangeType === "custom" && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-foreground focus:outline-none focus:border-accent"
            />
            <span className="text-muted">–</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-foreground focus:outline-none focus:border-accent"
            />
          </div>
        )}
      </div>

      {/* 3. Top 8 KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Today's Revenue */}
        <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-5 sm:p-6 space-y-2 shadow-[0_8px_30px_rgba(0,0,0,0.18)] hover:border-white/[0.16] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
              {t.analytics.todayRevenue}
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {formatCurrency(k.todayRevenue.value, locale)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            {k.todayRevenue.direction === "up" ? (
              <span className="text-emerald-400 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />+{k.todayRevenue.percentChange}%
              </span>
            ) : k.todayRevenue.direction === "down" ? (
              <span className="text-rose-400 font-semibold flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />-{k.todayRevenue.percentChange}%
              </span>
            ) : (
              <span className="text-muted">0%</span>
            )}
            <span className="text-muted/60">{t.analytics.vsYesterday}</span>
          </div>
        </div>

        {/* KPI 2: Yesterday's Revenue */}
        <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-5 sm:p-6 space-y-2 shadow-[0_8px_30px_rgba(0,0,0,0.18)] hover:border-white/[0.16] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
              {t.analytics.yesterdayRevenue}
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {formatCurrency(k.yesterdayRevenue.value, locale)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            {k.yesterdayRevenue.direction === "up" ? (
              <span className="text-emerald-400 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />+{k.yesterdayRevenue.percentChange}%
              </span>
            ) : k.yesterdayRevenue.direction === "down" ? (
              <span className="text-rose-400 font-semibold flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />-{k.yesterdayRevenue.percentChange}%
              </span>
            ) : (
              <span className="text-muted">0%</span>
            )}
            <span className="text-muted/60">{t.analytics.vsPrevPeriod}</span>
          </div>
        </div>

        {/* KPI 3: Revenue This Week */}
        <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-5 sm:p-6 space-y-2 shadow-[0_8px_30px_rgba(0,0,0,0.18)] hover:border-white/[0.16] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
              {t.analytics.weekRevenue}
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {formatCurrency(k.weekRevenue.value, locale)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            {k.weekRevenue.direction === "up" ? (
              <span className="text-emerald-400 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />+{k.weekRevenue.percentChange}%
              </span>
            ) : k.weekRevenue.direction === "down" ? (
              <span className="text-rose-400 font-semibold flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />-{k.weekRevenue.percentChange}%
              </span>
            ) : (
              <span className="text-muted">0%</span>
            )}
            <span className="text-muted/60">{t.analytics.vsPrevPeriod}</span>
          </div>
        </div>

        {/* KPI 4: Revenue This Month */}
        <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-5 sm:p-6 space-y-2 shadow-[0_8px_30px_rgba(0,0,0,0.18)] hover:border-white/[0.16] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
              {t.analytics.monthRevenue}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {formatCurrency(k.monthRevenue.value, locale)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            {k.monthRevenue.direction === "up" ? (
              <span className="text-emerald-400 font-semibold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />+{k.monthRevenue.percentChange}%
              </span>
            ) : k.monthRevenue.direction === "down" ? (
              <span className="text-rose-400 font-semibold flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" />-{k.monthRevenue.percentChange}%
              </span>
            ) : (
              <span className="text-muted">0%</span>
            )}
            <span className="text-muted/60">{t.analytics.vsPrevPeriod}</span>
          </div>
        </div>

        {/* KPI 5: Today's Completed Appointments */}
        <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-5 sm:p-6 space-y-2 shadow-[0_8px_30px_rgba(0,0,0,0.18)] hover:border-white/[0.16] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
              {t.analytics.todayCompleted}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {k.todayCompletedCount.value}
          </div>
          <div className="text-[11px] font-mono text-muted">
            {t.analytics.todayCancelled}:{" "}
            <span className="text-rose-400 font-bold">{k.todayCancelledCount.value}</span>
          </div>
        </div>

        {/* KPI 6: Cancellation Rate & Potential Lost */}
        <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-5 sm:p-6 space-y-2 shadow-[0_8px_30px_rgba(0,0,0,0.18)] hover:border-white/[0.16] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
              {t.analytics.cancellationRate}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-rose-400">
            {analytics.cancellations.cancellationRate}%
          </div>
          <div className="text-[11px] font-mono text-muted truncate">
            {t.analytics.potentialLostRevenue}:{" "}
            <span className="text-rose-300 font-semibold">
              {formatCurrency(analytics.cancellations.potentialLostRevenue, locale)}
            </span>
          </div>
        </div>

        {/* KPI 7: Average Transaction Value (ATV) */}
        <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-5 sm:p-6 space-y-2 shadow-[0_8px_30px_rgba(0,0,0,0.18)] hover:border-white/[0.16] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
              {t.analytics.atv}
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {formatCurrency(k.averageTransactionValue.value, locale)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
            <span>{t.analytics.atvShort}</span>
          </div>
        </div>

        {/* KPI 8: Expected Revenue Tomorrow Preview */}
        <div className="bg-gradient-to-br from-accent/15 via-[#1d202c]/90 to-[#222533] backdrop-blur-xl border border-accent/35 rounded-3xl p-5 sm:p-6 space-y-2 shadow-[0_8px_30px_rgba(197,168,128,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-bold">
                {t.analytics.forecastTomorrow}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-accent/20 text-accent border border-accent/30">
              {fTomorrow.confidencePercent}% {t.analytics.forecastConfidence}
            </span>
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {formatCurrency(fTomorrow.expectedTotalRevenue, locale)}
          </div>
          <div className="text-[11px] font-mono text-zinc-400 truncate">
            {t.analytics.confirmedBookedRevenue}:{" "}
            <span className="text-zinc-200 font-semibold">{formatCurrency(fTomorrow.confirmedBookedRevenue, locale)}</span>
          </div>
        </div>
      </div>

      {/* 4. Interactive Trend Chart Card */}
      <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_12px_45px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span>{t.analytics.trendTitle}</span>
            </h3>
            <p className="text-xs text-muted font-mono mt-0.5">
              {t.analytics.trendSubtitle} ({analytics.trend.startDate} – {analytics.trend.endDate})
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-muted block text-[10px] uppercase">{t.analytics.revenue}</span>
              <span className="font-bold text-accent text-sm">
                {formatCurrency(analytics.trend.overallRealizedRevenue, locale)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted block text-[10px] uppercase">{t.analytics.completedCount}</span>
              <span className="font-bold text-foreground text-sm">
                {analytics.trend.overallCompletedCount}
              </span>
            </div>
          </div>
        </div>

        <FinancialTrendChart
          points={analytics.trend.points}
          locale={locale}
          labels={{
            revenue: t.analytics.revenueMetric,
            completed: t.analytics.completedMetric,
            atv: t.analytics.atvMetric,
            cancellations: t.analytics.cancellationsMetric,
            actual: t.analytics.actual,
            forecast: t.analytics.forecast,
          }}
        />
      </div>

      {/* 5. Tomorrow Forecast Deep Dive & Month-End Projection Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tomorrow Detailed Forecast (7 cols) */}
        <div className="lg:col-span-7 bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide">
                  {t.analytics.forecastTomorrow} ({fTomorrow.targetDate})
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent/15 border border-accent/30 text-accent">
                {fTomorrow.confidencePercent}% {t.analytics.forecastConfidence}
              </span>
            </div>

            {/* Expected Revenue Range */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted uppercase">{t.analytics.forecastRevenue}</span>
                <span className="font-display text-2xl font-bold text-accent">
                  {formatCurrency(fTomorrow.expectedTotalRevenue, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-white/[0.04] pt-2">
                <span>{t.analytics.confidenceInterval}:</span>
                <span className="font-semibold text-zinc-200">
                  {formatCurrency(fTomorrow.predictionRange.low, locale)} – {formatCurrency(fTomorrow.predictionRange.high, locale)}
                </span>
              </div>
            </div>

            {/* Key factors */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-[10px] text-muted block uppercase">{t.analytics.confirmedBookedRevenue}</span>
                <span className="font-bold text-foreground block text-sm mt-0.5">
                  {formatCurrency(fTomorrow.confirmedBookedRevenue, locale)}
                </span>
                <span className="text-[10px] text-zinc-400">({fTomorrow.confirmedBookingsCount} bookings)</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-[10px] text-muted block uppercase">{t.analytics.openSlotsTomorrow}</span>
                <span className="font-bold text-accent block text-sm mt-0.5">
                  {fTomorrow.availableSlotsCount} slots open
                </span>
                <span className="text-[10px] text-zinc-400">
                  +{formatCurrency(fTomorrow.potentialAdditionalRevenue, locale)} potential
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-[10px] text-muted block uppercase">{t.analytics.expectedAppointments}</span>
                <span className="font-bold text-emerald-400 block text-sm mt-0.5">
                  ~{fTomorrow.expectedCompletedAppointments}
                </span>
                <span className="text-[10px] text-zinc-400">({fTomorrow.historicalCompletionRate}% completion)</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-[10px] text-muted block uppercase">{t.analytics.expectedCancellations}</span>
                <span className="font-bold text-rose-400 block text-sm mt-0.5">
                  ~{fTomorrow.expectedCancellations}
                </span>
                <span className="text-[10px] text-zinc-400">
                  ~{formatCurrency(fTomorrow.expectedCancellationRevenue, locale)} lost
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-mono text-muted/60 pt-3 border-t border-white/[0.06]">
            ℹ️ {t.analytics.limitedDataNotice}
          </p>
        </div>

        {/* Month-End Projected Revenue (5 cols) */}
        <div className="lg:col-span-5 bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-white/[0.06] pb-3 mb-4">
              <Calendar className="w-4 h-4 text-accent" />
              <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide">
                {t.analytics.monthEndForecastTitle}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-mono uppercase text-muted block">
                  {mEnd.currentMonth} Projected Realized
                </span>
                <span className="font-display text-3xl font-bold text-foreground block mt-1">
                  {formatCurrency(mEnd.forecastMonthEndRevenue, locale)}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono mt-1">
                  {mEnd.forecastChangePercent >= 0 ? (
                    <span className="text-emerald-400 font-semibold flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5" />+{mEnd.forecastChangePercent}%
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center">
                      <ArrowDownRight className="w-3.5 h-3.5" />{mEnd.forecastChangePercent}%
                    </span>
                  )}
                  <span className="text-muted/60">{t.analytics.vsPrevPeriod}</span>
                </div>
              </div>

              {/* Progress of month */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-muted">
                  <span>Day {mEnd.daysElapsed} of {mEnd.totalDaysInMonth}</span>
                  <span>{mEnd.remainingDays} days remaining</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${Math.round((mEnd.daysElapsed / mEnd.totalDaysInMonth) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2 pt-2 text-xs font-mono border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-muted">{t.analytics.revenueMetric} so far:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(mEnd.revenueSoFar, locale)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Expected remaining days:</span>
                  <span className="font-semibold text-accent">
                    +{formatCurrency(mEnd.expectedRemainingDaysRevenue, locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted/80">
                  <span>Previous month actual:</span>
                  <span>{formatCurrency(mEnd.previousMonthRevenue, locale)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 pt-3 border-t border-white/[0.06]">
            Confidence: {mEnd.confidence}% • Formula: realized revenue + (confirmed bookings × historical completion rate)
          </div>
        </div>
      </div>

      {/* 6. 7-Day Forward Forecast Strip */}
      <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-7 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-accent" />
            <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide">
              {t.analytics.sevenDayForecastTitle}
            </h3>
          </div>
          <span className="text-xs font-mono text-muted">{t.analytics.sevenDayForecastSubtitle}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
          {analytics.sevenDayForecast.map((day) => (
            <div
              key={day.date}
              className="p-3.5 rounded-2xl bg-black/30 border border-white/[0.06] hover:border-accent/40 transition-all flex flex-col justify-between space-y-2 group"
            >
              <div>
                <span className="text-[10px] font-mono uppercase text-muted block">{day.weekday.slice(0, 3)}</span>
                <span className="font-mono text-xs font-bold text-foreground block">{day.date.slice(5)}</span>
              </div>

              <div className="space-y-1">
                <span className="font-display text-sm font-bold text-accent block">
                  {formatCurrency(day.expectedRevenue, locale)}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 block">
                  {day.alreadyBookedCount} booked ({day.expectedCompleted} exp)
                </span>
              </div>

              <div className="pt-1 border-t border-white/[0.04] text-[9px] font-mono text-muted/70">
                Conf: {day.confidence}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Weekday and Hourly Performance Breakdown */}
      <WeekdayTimeChart
        weekdayData={analytics.weekdayPerformance}
        timeSlotData={analytics.timeSlotPerformance}
        locale={locale}
        labels={{
          weekdayTitle: t.analytics.weekdayAnalysisTitle,
          timeSlotTitle: t.analytics.timeSlotAnalysisTitle,
          completed: t.analytics.completedCount,
          cancellationRate: t.analytics.cancellationRate,
          atv: t.analytics.atvShort,
        }}
      />

      {/* 8. Service Financial Performance Table */}
      <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
              <Scissors className="w-4 h-4" />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide">
              {t.analytics.servicePerformanceTitle}
            </h3>
          </div>
          {analytics.services.topRevenueService && (
            <span className="text-xs font-mono text-accent">
              Top: <strong className="text-foreground">{analytics.services.topRevenueService}</strong>
            </span>
          )}
        </div>

        {sortedServices.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-muted">{t.analytics.noDataDesc}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-400 uppercase text-[10px] tracking-wider cursor-pointer">
                  <th className="py-3 px-4" onClick={() => handleServiceSort("serviceName")}>
                    {t.analytics.serviceName}
                  </th>
                  <th className="py-3 px-4" onClick={() => handleServiceSort("completedBookingsCount")}>
                    {t.analytics.completedCount}
                  </th>
                  <th className="py-3 px-4" onClick={() => handleServiceSort("realizedRevenue")}>
                    {t.analytics.revenue}
                  </th>
                  <th className="py-3 px-4" onClick={() => handleServiceSort("averagePrice")}>
                    {t.analytics.avgPrice}
                  </th>
                  <th className="py-3 px-4" onClick={() => handleServiceSort("revenueSharePercent")}>
                    {t.analytics.revenueShare}
                  </th>
                  <th className="py-3 px-4 text-right" onClick={() => handleServiceSort("cancellationRate")}>
                    {t.analytics.cancellationRate}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sortedServices.map((s) => (
                  <tr key={s.serviceId} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground font-sans">{s.serviceName}</td>
                    <td className="py-3.5 px-4 text-zinc-300">{s.completedBookingsCount}</td>
                    <td className="py-3.5 px-4 text-accent font-bold">
                      {formatCurrency(s.realizedRevenue, locale)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">{formatCurrency(s.averagePrice, locale)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${s.revenueSharePercent}%` }} />
                        </div>
                        <span>{s.revenueSharePercent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={s.cancellationRate > 20 ? "text-rose-400 font-bold" : "text-zinc-400"}>
                        {s.cancellationRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 9. Customer Intelligence and Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer KPIs (4 cols) */}
        <div className="lg:col-span-4 bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          <div className="flex items-center space-x-2 border-b border-white/[0.06] pb-3">
            <Users className="w-4 h-4 text-accent" />
            <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide">
              {t.analytics.customerIntelligenceTitle}
            </h3>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/[0.04]">
              <span className="text-muted">{t.analytics.totalCustomers}:</span>
              <span className="font-bold text-foreground text-sm">{analytics.customers.totalUniqueCustomers}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/[0.04]">
              <span className="text-muted">{t.analytics.newCustomers}:</span>
              <span className="font-bold text-foreground text-sm">{analytics.customers.newCustomersCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/[0.04]">
              <span className="text-muted">{t.analytics.returningCustomers}:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {analytics.customers.returningCustomersCount}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/[0.04]">
              <span className="text-muted">{t.analytics.repeatBookingRate}:</span>
              <span className="font-bold text-accent text-sm">
                {analytics.customers.repeatBookingRatePercent}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/[0.04]">
              <span className="text-muted">{t.analytics.customerLTV}:</span>
              <span className="font-bold text-accent text-sm">
                {formatCurrency(analytics.customers.averageCustomerLifetimeValue, locale)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Clients by Revenue (8 cols) */}
        <div className="lg:col-span-8 bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-7 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          <div className="flex items-center space-x-2 border-b border-white/[0.06] pb-3">
            <UserCheck className="w-4 h-4 text-accent" />
            <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide">
              {t.analytics.topCustomersTitle}
            </h3>
          </div>

          {analytics.customers.topCustomers.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted">{t.analytics.noDataDesc}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/[0.06] text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">Phone (Masked)</th>
                    <th className="py-2.5 px-3">Completed</th>
                    <th className="py-2.5 px-3 text-right">Total Realized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {analytics.customers.topCustomers.map((c, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-semibold text-foreground">{c.guestName}</td>
                      <td className="py-3 px-3 text-zinc-400">{c.phoneMasked}</td>
                      <td className="py-3 px-3 text-emerald-400">{c.completedBookingsCount} visits</td>
                      <td className="py-3 px-3 text-right text-accent font-bold">
                        {formatCurrency(c.totalRealizedRevenue, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 10. Schedule Utilization & Business Opportunity */}
      <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-7 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        <div className="flex items-center space-x-2 border-b border-white/[0.06] pb-3">
          <Clock className="w-4 h-4 text-accent" />
          <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide">
            {t.analytics.utilizationTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.04] space-y-1">
            <span className="text-muted uppercase text-[10px]">Total Open Slots</span>
            <div className="text-xl font-bold text-foreground">{analytics.utilization.totalOpenSlots}</div>
            <span className="text-[10px] text-zinc-400">Configured in calendar</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.04] space-y-1">
            <span className="text-muted uppercase text-[10px]">{t.analytics.bookingUtilization}</span>
            <div className="text-xl font-bold text-accent">{analytics.utilization.bookingUtilizationPercent}%</div>
            <span className="text-[10px] text-zinc-400">{analytics.utilization.bookedSlots} slots booked</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.04] space-y-1">
            <span className="text-muted uppercase text-[10px]">{t.analytics.completedUtilization}</span>
            <div className="text-xl font-bold text-emerald-400">
              {analytics.utilization.completedUtilizationPercent}%
            </div>
            <span className="text-[10px] text-zinc-400">{analytics.utilization.completedSlots} completed</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.04] space-y-1">
            <span className="text-muted uppercase text-[10px]">{t.analytics.openSlotsTomorrow}</span>
            <div className="text-xl font-bold text-amber-400">{analytics.utilization.tomorrowOpenSlots}</div>
            <span className="text-[10px] text-zinc-400">
              +{formatCurrency(analytics.utilization.tomorrowPotentialRevenue, locale)} opp
            </span>
          </div>
        </div>
      </div>

      {/* 11. Business Insights & Anomaly Alerts */}
      <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-7 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        <div className="flex items-center space-x-2 border-b border-white/[0.06] pb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="font-display text-base font-bold text-foreground uppercase tracking-wide">
            {t.analytics.insightsTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.insights.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start space-x-3 ${
                item.type === "warning"
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-200"
                  : item.type === "positive"
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
                  : item.type === "opportunity"
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                  : "bg-white/[0.03] border-white/10 text-zinc-200"
              }`}
            >
              <div className="mt-0.5">
                {item.type === "warning" ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : item.type === "positive" ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-accent" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold font-mono tracking-wide">{item.title}</h4>
                <p className="text-[11px] font-sans opacity-90 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
