"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // Complete progress on route change
  React.useEffect(() => {
    if (isLoading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Listen to internal link clicks to trigger loader instantly
  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const isTargetBlank = target.getAttribute("target") === "_blank";
      const isModifierKey = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
        return;
      }

      if (isTargetBlank || isModifierKey) return;

      const currentOrigin = window.location.origin;
      const isInternal = href.startsWith("/") || href.startsWith(currentOrigin);

      if (isInternal) {
        const nextUrl = new URL(href, currentOrigin);
        const currentUrl = new URL(window.location.href);

        // Don't trigger for identical URL
        if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) {
          return;
        }

        setIsLoading(true);
        setProgress(25);

        interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) {
              clearInterval(interval);
              return 85;
            }
            return prev + Math.floor(Math.random() * 15) + 10;
          });
        }, 150);
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      clearInterval(interval);
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-all duration-300 ease-out"
      style={{
        opacity: progress === 100 ? 0 : 1,
      }}
    >
      <div
        className="h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.8)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}

export function GlobalTopLoader() {
  return (
    <React.Suspense fallback={null}>
      <TopLoader />
    </React.Suspense>
  );
}
