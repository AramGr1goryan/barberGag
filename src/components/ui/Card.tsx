import React from "react";
import { clsx } from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, elevated = false, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "relative rounded-3xl border transition-all duration-300 p-6 overflow-hidden",
        elevated
          ? "bg-[#242838]/80 backdrop-blur-2xl border-white/[0.12] shadow-[0_14px_40px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "bg-[#1d202c]/75 backdrop-blur-xl border-white/[0.09] shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/[0.16]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
