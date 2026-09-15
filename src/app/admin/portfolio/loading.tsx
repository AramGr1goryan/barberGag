import React from "react";
import { MediaGridSkeleton } from "@/components/ui/Skeleton";

export default function PortfolioLoading() {
  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-white/[0.04] rounded-xl animate-pulse" />
      </div>
      
      <MediaGridSkeleton count={8} />
    </div>
  );
}
