import React from "react";
import { clsx } from "clsx";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: "full" | "3xl" | "2xl" | "xl" | "lg" | "md" | "sm" | "none";
}

export function Skeleton({ className, rounded = "2xl", ...props }: SkeletonProps) {
  const roundedClasses = {
    full: "rounded-full",
    "3xl": "rounded-3xl",
    "2xl": "rounded-2xl",
    xl: "rounded-xl",
    lg: "rounded-lg",
    md: "rounded-md",
    sm: "rounded-sm",
    none: "rounded-none",
  };

  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-[#1d202c]/60 border border-white/[0.04]",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-[#c5a880]/[0.08] after:to-transparent after:pointer-events-none",
        roundedClasses[rounded],
        className
      )}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-1/3" rounded="lg" />
        <Skeleton className="h-8 w-1/4" rounded="lg" />
      </div>
      <div className="border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/[0.06] bg-white/[0.02] p-4 gap-4">
          <Skeleton className="h-4 w-1/6" rounded="md" />
          <Skeleton className="h-4 w-1/4" rounded="md" />
          <Skeleton className="h-4 w-1/4" rounded="md" />
          <Skeleton className="h-4 w-1/4" rounded="md" />
          <Skeleton className="h-4 w-1/12" rounded="md" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex border-b border-white/[0.02] p-4 gap-4 items-center">
            <Skeleton className="h-4 w-1/6" rounded="md" />
            <Skeleton className="h-4 w-1/4" rounded="md" />
            <Skeleton className="h-4 w-1/4" rounded="md" />
            <Skeleton className="h-4 w-1/4" rounded="md" />
            <Skeleton className="h-8 w-8 ml-auto" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-3xl bg-[#1d202c]/75 border border-white/[0.09] space-y-4">
      <Skeleton className="h-4 w-1/3 mb-6" rounded="md" />
      <Skeleton className="h-10 w-full" rounded="xl" />
      <Skeleton className="h-4 w-3/4" rounded="md" />
      <Skeleton className="h-4 w-1/2" rounded="md" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-3xl bg-[#1d202c]/75 border border-white/[0.09] space-y-4 flex flex-col justify-center">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10" rounded="xl" />
        <Skeleton className="h-4 w-24" rounded="md" />
      </div>
      <Skeleton className="h-8 w-32 mt-4" rounded="md" />
      <Skeleton className="h-3 w-48" rounded="md" />
    </div>
  );
}

export function MediaGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="w-full aspect-[4/5]" rounded="3xl" />
          <Skeleton className="h-4 w-2/3 mx-auto" rounded="md" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6 w-full max-w-2xl">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" rounded="md" />
          <Skeleton className="h-12 w-full" rounded="xl" />
        </div>
      ))}
      <Skeleton className="h-12 w-full max-w-[200px]" rounded="full" />
    </div>
  );
}
