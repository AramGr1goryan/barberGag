import React from "react";
import Link from "next/link";
import { Scissors, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#16161a]/80 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-accent">
          <Scissors className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[12px] font-mono tracking-widest text-accent uppercase font-semibold">
            404 • Not Found
          </span>
          <h1 className="font-display text-3xl font-bold text-white uppercase tracking-wider">
            Страница не найдена
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Запрошенная страница не существует или была перемещена. Перейдите на главную страницу для онлайн-записи к мастеру.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-lg"
          >
            <Home className="w-4 h-4 text-accent" />
            <span>На главную страницу</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
