"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Module Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1d202c]/90 border border-rose-500/30 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono tracking-widest text-rose-300 uppercase font-semibold">
            Панель управления
          </span>
          <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wider">
            Ошибка модуля
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            В данном разделе административной панели произошла ошибка. Вы можете повторить операцию или вернуться на главную панель.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-200 text-xs font-semibold tracking-wider uppercase transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Обновить раздел</span>
          </button>

          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-300 hover:text-white text-xs font-semibold tracking-wider uppercase transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>В обзор</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
