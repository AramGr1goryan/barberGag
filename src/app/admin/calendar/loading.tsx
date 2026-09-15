import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CalendarLoading() {
  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <Skeleton className="h-8 w-64" rounded="lg" />
        <Skeleton className="h-10 w-48" rounded="full" />
      </div>

      <div className="grid grid-cols-7 gap-4">
        {/* Days Header */}
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-6 w-full" rounded="md" />
        ))}
        {/* Calendar Grid */}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={`day-${i}`} className="h-32 w-full" rounded="xl" />
        ))}
      </div>
    </div>
  );
}
