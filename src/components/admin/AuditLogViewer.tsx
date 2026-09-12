"use client";

import React from "react";
import { useAdminI18n } from "@/context/AdminI18nContext";

export interface AuditLogItem {
  id: string;
  createdAt: string;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
}

export function AuditLogViewer({ logs }: { logs: AuditLogItem[] }) {
  const { t, locale } = useAdminI18n();
  const localeFormatted = locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#c5a880]" />
          <span className="text-[11px] font-mono tracking-widest text-accent uppercase font-semibold">
            {t.dashboard.executiveOverview}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-tight">
          {t.audit.title}
        </h1>
        <p className="text-xs text-muted font-mono mt-1">
          {t.audit.subtitle}
        </p>
      </div>

      <div className="bg-[#1d202c]/75 backdrop-blur-xl border border-white/[0.09] rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-muted">
            {t.audit.noLogsFound}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">{t.audit.timestamp}</th>
                  <th className="py-3.5 px-4">{t.audit.user}</th>
                  <th className="py-3.5 px-4">{t.audit.action}</th>
                  <th className="py-3.5 px-4">{t.audit.entity}</th>
                  <th className="py-3.5 px-4">{t.audit.entityId}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-muted whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString(localeFormatted)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-accent/10 border border-accent/20 text-accent">
                        {log.actorEmail || "SYSTEM"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/[0.04] border border-white/10 text-foreground">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted">{log.entity}</td>
                    <td className="py-3.5 px-4 text-muted max-w-[150px] truncate">{log.entityId || "-"}</td>
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
