import React from "react";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function BookingsLoading() {
  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
      </div>
      
      {/* Stats Capsules Skeleton */}
      <div className="flex flex-wrap gap-4">
        <div className="h-24 w-48 bg-white/[0.04] rounded-2xl animate-pulse" />
        <div className="h-24 w-48 bg-white/[0.04] rounded-2xl animate-pulse" />
        <div className="h-24 w-48 bg-white/[0.04] rounded-2xl animate-pulse" />
      </div>

      <TableSkeleton rows={7} />
    </div>
  );
}
