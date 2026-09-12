"use client";

import React, { forwardRef } from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={clsx(
            "w-full bg-white/[0.03] backdrop-blur-md border rounded-2xl px-4 py-3 text-sm text-foreground placeholder-muted/50 transition-all duration-200 focus:outline-none focus:ring-2",
            error
              ? "border-red-500/80 focus:border-red-500 focus:ring-red-500/20"
              : "border-white/10 hover:border-white/20 focus:border-accent focus:ring-accent/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
