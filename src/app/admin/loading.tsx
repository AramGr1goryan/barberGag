import React from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function AdminLoading() {
  return (
    <div className="flex-1 min-h-[calc(100vh-6rem)] bg-[#0d0d0f] flex flex-col items-center justify-center relative overflow-hidden rounded-tl-3xl">
      <LoadingSpinner size="lg" label="LOADING DASHBOARD..." />
    </div>
  );
}
