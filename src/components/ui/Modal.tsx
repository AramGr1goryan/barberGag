"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${maxWidthStyles[maxWidth]} max-h-[92vh] flex flex-col bg-[#1c1f2b]/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.5)] p-4 sm:p-6 z-10 my-auto`}
          >
            {/* Ambient subtle glow at top of modal */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent/15 blur-3xl pointer-events-none rounded-full" />

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-muted hover:text-foreground transition-all z-20"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Header (sticky/fixed at top of modal) */}
            {(title || description) && (
              <div className="mb-3 pr-8 shrink-0">
                {title && (
                  <h3 className="font-display text-base sm:text-lg font-bold tracking-wide text-foreground">
                    {title}
                  </h3>
                )}
                {description && <p className="text-[11px] text-muted mt-0.5 leading-tight">{description}</p>}
              </div>
            )}

            {/* Content with smooth internal scroll */}
            <div className="overflow-y-auto flex-1 pr-1 overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
