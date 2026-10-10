"use client";

import * as React from "react";
import { CalendarCheck } from "lucide-react";

/** Phone-only sticky bar: jumps to the booking panel, hides itself once it is on screen. */
export function MobileBookBar({ label, price, targetId = "book" }: { label: string; price: string; targetId?: string }) {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry?.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-neutral-950/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-white/70">{label}</div>
          <div className="text-lg leading-tight font-black text-amber-300">{price}</div>
        </div>
        <button
          type="button"
          onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/30 active:scale-95"
        >
          <CalendarCheck className="size-4" /> Book Now
        </button>
      </div>
    </div>
  );
}
