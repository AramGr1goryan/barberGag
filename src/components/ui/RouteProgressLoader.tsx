"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgressLoader() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When pathname or searchParams change, we've arrived.
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement | null;
      if (!target) return;
      
      const href = target.getAttribute("href");
      if (!href) return;
      
      const isExternal = href.startsWith("http") && !href.startsWith(window.location.origin);
      const isAnchor = href.startsWith("#");
      
      if (!isExternal && !isAnchor && target.target !== "_blank") {
        // We are navigating internally
        if (href !== window.location.pathname + window.location.search) {
          setIsNavigating(true);
        }
      }
    };

    const addListeners = () => {
      const links = document.querySelectorAll("a");
      links.forEach((link) => {
        link.addEventListener("click", handleAnchorClick as EventListener);
      });
    };

    addListeners();

    // Re-bind listeners on DOM changes (e.g. after React mounts new links)
    const observer = new MutationObserver(() => {
      addListeners();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const links = document.querySelectorAll("a");
      links.forEach((link) => {
        link.removeEventListener("click", handleAnchorClick as EventListener);
      });
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none flex flex-col">
      {/* 1px glowing line container */}
      <div className="h-[2px] w-full bg-accent/20 overflow-hidden relative">
        {/* The shooting progress beam */}
        <div className="absolute top-0 left-0 h-full w-[30%] bg-accent animate-[shimmer_1.5s_infinite] shadow-[0_0_20px_2px_rgba(197,168,128,1)] rounded-full" />
      </div>
      {/* Subtle top screen glow when loading */}
      <div className="h-20 w-full bg-gradient-to-b from-accent/10 to-transparent opacity-50 animate-pulse" />
    </div>
  );
}
