"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => {
      showToast({ type: "success", title, message });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      showToast({ type: "error", title: title || "Ошибка", message, duration: 6000 });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      showToast({ type: "warning", title, message });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      showToast({ type: "info", title, message });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-[420px] z-[99999] flex flex-col gap-2.5 pointer-events-none transition-all duration-300"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const isError = toast.type === "error";
  const isSuccess = toast.type === "success";
  const isWarning = toast.type === "warning";

  const colorStyles = isError
    ? "bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-[0_12px_40px_rgba(244,63,94,0.2)]"
    : isSuccess
    ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-[0_12px_40px_rgba(16,185,129,0.2)]"
    : isWarning
    ? "bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-[0_12px_40px_rgba(245,158,11,0.2)]"
    : "bg-zinc-900/90 border-zinc-700/60 text-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.5)]";

  const iconColor = isError
    ? "text-rose-400"
    : isSuccess
    ? "text-emerald-400"
    : isWarning
    ? "text-amber-400"
    : "text-blue-400";

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${colorStyles}`}
      role="alert"
    >
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        {isSuccess && <CheckCircle2 className="w-5 h-5" />}
        {isError && <AlertCircle className="w-5 h-5" />}
        {isWarning && <AlertTriangle className="w-5 h-5" />}
        {toast.type === "info" && <Info className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <h5 className="font-semibold text-sm leading-snug tracking-wide text-white">
            {toast.title}
          </h5>
        )}
        <p className="text-xs font-sans text-white/90 leading-relaxed break-words whitespace-pre-wrap">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
