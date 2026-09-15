"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Phone, Clock, Check, X, RefreshCw } from "lucide-react";

export interface CallbackItem {
  id: string;
  name: string;
  phone: string;
  preferredTime: string | null;
  message: string | null;
  status: "NEW" | "CONTACTED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
}

export function CallbacksManager() {
  const { t, locale } = useAdminI18n();
  const [callbacks, setCallbacks] = useState<CallbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCallbacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/callbacks");
      const data = await res.json();
      if (data.callbacks) setCallbacks(data.callbacks);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCallbacks();
  }, [fetchCallbacks]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/callbacks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) fetchCallbacks();
    } catch {
      // ignore
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NEW":
        return t.callbacks.statusPending;
      case "CONTACTED":
        return t.callbacks.statusCalled;
      case "COMPLETED":
        return t.bookings.statusCompleted;
      case "CANCELLED":
        return t.bookings.statusCancelled;
      default:
        return status;
    }
  };

  const localeFormatted = locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US";

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-semibold">
            {t.dashboard.executiveOverview}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1 uppercase">
            {t.callbacks.title}
          </h1>
        </div>

        <Button size="sm" variant="outline" onClick={fetchCallbacks} className="gap-2 rounded-full border-white/10 hover:border-white/20">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t.common.refresh}</span>
        </Button>
      </div>

      <div className="bg-[#1d202c]/75 border border-white/[0.09] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_12px_45px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : callbacks.length === 0 ? (
          <div className="py-14 text-center text-xs font-mono text-muted">
            {t.callbacks.noCallbacks}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">{t.callbacks.date}</th>
                  <th className="py-3 px-3">{t.callbacks.customerName}</th>
                  <th className="py-3 px-3">{t.callbacks.phone}</th>
                  <th className="py-3 px-3">{t.callbacks.preferredTime}</th>
                  <th className="py-3 px-3">{t.callbacks.message}</th>
                  <th className="py-3 px-3">{t.callbacks.status}</th>
                  <th className="py-3 px-3 text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {callbacks.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.03] transition-colors rounded-2xl">
                    <td className="py-4 px-3 text-zinc-400">
                      {new Date(c.createdAt).toLocaleDateString(localeFormatted)}
                    </td>
                    <td className="py-4 px-3 text-foreground font-sans font-semibold">{c.name}</td>
                    <td className="py-4 px-3 text-accent">
                      <a href={`tel:${c.phone}`} className="hover:underline flex items-center space-x-1.5">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>{c.phone}</span>
                      </a>
                    </td>
                    <td className="py-4 px-3 text-zinc-300">{c.preferredTime || t.common.all}</td>
                    <td className="py-4 px-3 text-zinc-400 max-w-[200px] truncate">{c.message || "-"}</td>
                    <td className="py-4 px-3">
                      <Badge
                        variant={
                          c.status === "NEW"
                            ? "gold"
                            : c.status === "COMPLETED"
                            ? "green"
                            : c.status === "CANCELLED"
                            ? "red"
                            : "gray"
                        }
                      >
                        {getStatusLabel(c.status)}
                      </Badge>
                    </td>
                    <td className="py-4 px-3 text-right space-x-1.5">
                      {c.status === "NEW" && (
                        <button
                          onClick={() => handleUpdateStatus(c.id, "CONTACTED")}
                          className="px-3 py-1.5 text-[10px] rounded-xl border border-accent/40 text-accent hover:bg-accent/15 transition-all shadow-sm"
                        >
                          {t.callbacks.markProcessed}
                        </button>
                      )}
                      {c.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleUpdateStatus(c.id, "COMPLETED")}
                          className="px-3 py-1.5 text-[10px] rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/15 transition-all shadow-sm"
                        >
                          {t.bookings.markCompleted}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

