import React from "react";
import { clsx } from "clsx";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "full" | "2xl" | "3xl" | "xl" | "lg" | "md";
}

export function Skeleton({ className, rounded = "2xl", ...props }: SkeletonProps) {
  const roundedClasses = {
    full: "rounded-full",
    "3xl": "rounded-3xl",
    "2xl": "rounded-2xl",
    xl: "rounded-xl",
    lg: "rounded-lg",
    md: "rounded-md",
  };

  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-white/[0.04] border border-white/[0.04] animate-pulse",
        roundedClasses[rounded],
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none" />
    </div>
  );
}
