"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none uppercase text-xs rounded-full overflow-hidden";

    const variantStyles = {
      primary:
        "bg-accent text-accent-foreground hover:bg-accent-hover shadow-[0_4px_25px_rgba(197,168,128,0.3)] hover:shadow-[0_6px_35px_rgba(197,168,128,0.5)] border border-accent/30 font-semibold hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_15px_rgba(197,168,128,0.3)]",
      secondary:
        "bg-white/[0.04] backdrop-blur-xl text-foreground hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] shadow-[0_4px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] hover:-translate-y-0.5 active:translate-y-0",
      outline:
        "bg-transparent text-foreground border border-white/[0.12] hover:border-accent/50 hover:text-accent hover:bg-accent/[0.05] hover:shadow-[0_0_20px_rgba(197,168,128,0.1)] backdrop-blur-sm",
      ghost:
        "bg-transparent text-muted hover:text-foreground hover:bg-white/[0.05] rounded-xl",
      danger:
        "bg-red-950/30 backdrop-blur-xl text-red-400 border border-red-500/20 hover:bg-red-900/40 hover:text-red-200 hover:border-red-500/40 shadow-[0_4px_25px_rgba(220,38,38,0.15)] hover:shadow-[0_6px_30px_rgba(220,38,38,0.25)]",
    };

    const sizeStyles = {
      sm: "px-4 py-2 text-[11px] gap-1.5",
      md: "px-6 py-2.5 text-xs gap-2 tracking-wider",
      lg: "px-9 py-3.5 text-sm gap-2.5 tracking-widest font-semibold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {/* Liquid glass shine overlay for primary & secondary */}
        {(variant === "primary" || variant === "secondary") && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.15] via-transparent to-transparent pointer-events-none" />
        )}
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
