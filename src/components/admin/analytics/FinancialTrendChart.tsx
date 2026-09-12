"use client";

import React, { useState } from "react";
import { DailyTrendPoint, MetricType } from "@/types/financial-analytics";
import { formatCurrency } from "@/lib/timezone";
import { TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";

interface FinancialTrendChartProps {
  points: DailyTrendPoint[];
  locale?: string;
  labels: {
    revenue: string;
    completed: string;
    atv: string;
    cancellations: string;
    actual: string;
    forecast: string;
  };
}

export function FinancialTrendChart({ points, locale = "hy", labels }: FinancialTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs font-mono text-muted">
        No trend data available
      </div>
    );
  }

  // Extract metric value for each point
  const getValue = (p: DailyTrendPoint): number => {
    switch (activeMetric) {
      case "revenue":
        return p.realizedRevenue;
      case "completed":
        return p.completedAppointments;
      case "atv":
        return p.averageTransactionValue;
      case "cancellations":
        return p.cancelledAppointments;
    }
  };

  const values = points.map(getValue);
  const maxValue = Math.max(...values, 1);
  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 35;
  const paddingY = 25;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Calculate coordinates
  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(1, points.length - 1)) * innerWidth;
    const val = getValue(p);
    const y = paddingY + innerHeight - (val / maxValue) * innerHeight;
    return { x, y, val, point: p };
  });

  // Construct SVG paths
  const linePath = coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`;
  }, "");

  const areaPath = `${linePath} L ${coords[coords.length - 1].x},${paddingY + innerHeight} L ${coords[0].x},${
    paddingY + innerHeight
  } Z`;

  // Grid lines
  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  const formatDisplayValue = (val: number): string => {
    if (activeMetric === "revenue" || activeMetric === "atv") {
      return formatCurrency(val, locale);
    }
    return Math.round(val).toString();
  };

  return (
    <div className="space-y-4">
      {/* Metric Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-full border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveMetric("revenue")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeMetric === "revenue"
                ? "bg-accent text-accent-foreground font-bold shadow-[0_2px_10px_rgba(197,168,128,0.3)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{labels.revenue}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric("completed")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeMetric === "completed"
                ? "bg-accent text-accent-foreground font-bold shadow-[0_2px_10px_rgba(197,168,128,0.3)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{labels.completed}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric("atv")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeMetric === "atv"
                ? "bg-accent text-accent-foreground font-bold shadow-[0_2px_10px_rgba(197,168,128,0.3)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{labels.atv}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric("cancellations")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 ${
              activeMetric === "cancellations"
                ? "bg-rose-500 text-white font-bold shadow-[0_2px_10px_rgba(244,63,94,0.3)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{labels.cancellations}</span>
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono text-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-accent rounded" />
            <span>{labels.actual}</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full aspect-[21/9] min-h-[220px]">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5a880" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#c5a880" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {gridLevels.map((lvl, idx) => {
            const y = paddingY + innerHeight - lvl * innerHeight;
            const labelVal = Math.round(lvl * maxValue);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {labelVal >= 1000 ? `${Math.round(labelVal / 1000)}k` : labelVal}
                </text>
              </g>
            );
          })}

          {/* Gradient Area Fill */}
          <path d={areaPath} fill="url(#chartGradient)" />

          {/* Line Curve */}
          <path
            d={linePath}
            fill="none"
            stroke={activeMetric === "cancellations" ? "#f43f5e" : "#c5a880"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {coords.map((c, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hitbox */}
                <circle cx={c.x} cy={c.y} r={12} fill="transparent" />

                {/* Visible dot on hover or endpoints */}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 5.5 : idx === 0 || idx === coords.length - 1 ? 3 : 2}
                  fill={activeMetric === "cancellations" ? "#f43f5e" : "#c5a880"}
                  stroke="#14161f"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* X-axis date labels for key steps */}
                {(idx === 0 ||
                  idx === coords.length - 1 ||
                  (coords.length > 7 && idx === Math.floor(coords.length / 2))) && (
                  <text
                    x={c.x}
                    y={chartHeight - 5}
                    textAnchor="middle"
                    fill="#9ca3af"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {c.point.dayLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && coords[hoveredIndex] && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full bg-[#181a24]/95 backdrop-blur-md border border-accent/40 rounded-2xl p-3 shadow-2xl space-y-1 text-xs font-mono"
            style={{
              left: `${(coords[hoveredIndex].x / chartWidth) * 100}%`,
              top: `${Math.max(10, (coords[hoveredIndex].y / chartHeight) * 100 - 10)}%`,
            }}
          >
            <div className="text-[10px] text-zinc-400 font-bold border-b border-white/10 pb-1">
              📅 {coords[hoveredIndex].point.date} ({coords[hoveredIndex].point.dayLabel})
            </div>
            <div className="text-accent font-bold text-sm">
              {formatDisplayValue(coords[hoveredIndex].val)}
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center justify-between gap-3 pt-0.5">
              <span>{labels.completed}: {coords[hoveredIndex].point.completedAppointments}</span>
              <span>{labels.cancellations}: {coords[hoveredIndex].point.cancelledAppointments}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
