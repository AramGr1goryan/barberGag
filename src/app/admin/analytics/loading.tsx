import React from "react";
import { StatCardSkeleton, CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-48 bg-white/[0.04] rounded-xl animate-pulse" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Table Skeleton */}
      <TableSkeleton rows={5} />
    </div>
  );
}
