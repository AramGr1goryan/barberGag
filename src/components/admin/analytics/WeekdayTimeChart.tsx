"use client";

import React from "react";
import { WeekdayPerformance, TimeSlotPerformance } from "@/types/financial-analytics";
import { formatCurrency } from "@/lib/timezone";
import { Clock, Calendar } from "lucide-react";

interface WeekdayTimeChartProps {
  weekdayData: WeekdayPerformance[];
  timeSlotData: TimeSlotPerformance[];
  locale?: string;
  labels: {
    weekdayTitle: string;
    timeSlotTitle: string;
    completed: string;
    cancellationRate: string;
    atv: string;
  };
}

export function WeekdayTimeChart({
  weekdayData,
  timeSlotData,
  locale = "hy",
  labels,
}: WeekdayTimeChartProps) {
  const maxWeekdayRevenue = Math.max(...weekdayData.map((d) => d.totalRealizedRevenue), 1);
  const maxTimeSlotRevenue = Math.max(...timeSlotData.map((t) => t.realizedRevenue), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Weekday Revenue Distribution */}
      <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        <div className="flex items-center space-x-2.5 border-b border-white/[0.06] pb-3">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wide">
            {labels.weekdayTitle}
          </h3>
        </div>

        <div className="space-y-3 pt-1">
          {weekdayData.map((d) => {
            const barWidthPercent = Math.round((d.totalRealizedRevenue / maxWeekdayRevenue) * 100);
            return (
              <div key={d.dayIndex} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-semibold">{d.dayName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-[11px]">
                      {d.completedAppointmentsCount} {labels.completed}
                    </span>
                    <span className="text-accent font-bold">
                      {formatCurrency(d.totalRealizedRevenue, locale)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className="h-full bg-gradient-to-r from-accent/40 to-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(barWidthPercent, d.totalRealizedRevenue > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Time Slot Performance (09:00 to 21:00) */}
      <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
        <div className="flex items-center space-x-2.5 border-b border-white/[0.06] pb-3">
          <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wide">
            {labels.timeSlotTitle}
          </h3>
        </div>

        <div className="space-y-3 pt-1">
          {timeSlotData.map((t) => {
            const barWidthPercent = Math.round((t.realizedRevenue / maxTimeSlotRevenue) * 100);
            return (
              <div key={t.timeBand} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-semibold">{t.timeBand}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-[11px]">
                      {t.completedCount} {labels.completed}
                    </span>
                    <span className="text-accent font-bold">
                      {formatCurrency(t.realizedRevenue, locale)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/[0.04]">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500/40 via-accent to-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(barWidthPercent, t.realizedRevenue > 0 ? 3 : 0)}%` }}
                  />
                </div>

                {/* Extra metrics */}
                <div className="flex items-center justify-between text-[10px] font-mono text-muted pt-0.5">
                  <span>{labels.atv}: {formatCurrency(t.averageTransactionValue, locale)}</span>
                  <span className={t.cancellationRatePercent > 20 ? "text-rose-400 font-bold" : "text-zinc-400"}>
                    {labels.cancellationRate}: {t.cancellationRatePercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
