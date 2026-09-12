import React from "react";
import { clsx } from "clsx";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "green" | "red" | "gray" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "gold", size = "sm", className }: BadgeProps) {
  const variantStyles = {
    gold: "bg-accent/10 text-accent border-accent/30 shadow-[0_0_12px_rgba(197,168,128,0.12)]",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.12)]",
    red: "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.12)]",
    gray: "bg-white/[0.04] text-zinc-400 border-white/10",
    outline: "border-white/15 text-foreground bg-transparent",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2.5 py-0.5 tracking-wider uppercase font-semibold",
    md: "text-xs px-3 py-1 tracking-wider uppercase font-semibold",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center border font-mono rounded-full backdrop-blur-md transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
