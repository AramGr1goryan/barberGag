import React from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ className, size = "md", label, fullScreen = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-2",
    xl: "w-16 h-16 border-[3px]",
  };

  const iconClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const content = (
    <div className={clsx("flex flex-col items-center justify-center space-y-5", className)}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing gold ring with gradient */}
        <div className={clsx("absolute rounded-full border-transparent border-t-[#c5a880] border-r-[#c5a880]/30 animate-spin shadow-[0_0_15px_rgba(197,168,128,0.5)]", sizeClasses[size])} />
        {/* Inner subtle reverse spin ring */}
        <div className={clsx("absolute rounded-full border-transparent border-b-[#c5a880]/60 border-l-[#c5a880]/20 animate-[spin_2s_reverse_infinite]", sizeClasses[size], "scale-[0.85]")} />
        {/* Center icon */}
        <Loader2 className={clsx("text-[#c5a880] animate-pulse drop-shadow-[0_0_8px_rgba(197,168,128,0.8)]", iconClasses[size])} />
      </div>
      {label && (
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#c5a880]/80 animate-pulse mt-4">
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
