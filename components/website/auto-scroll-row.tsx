"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";

/**
 * Horizontally scrollable row that gently auto-advances (swipe / drag / arrows still work).
 * Pauses on hover, touch and when the tab is hidden; respects "reduce motion".
 */
export function AutoScrollRow({ children, intervalMs = 3500 }: { children: React.ReactNode; intervalMs?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [paused, setPaused] = React.useState(false);
  const [userPaused, setUserPaused] = React.useState(false);

  const step = React.useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const amount = (card?.offsetWidth ?? 300) + 20;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && el.scrollLeft <= 8) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    if (paused || userPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => !document.hidden && step(1), intervalMs);
    return () => window.clearInterval(id);
  }, [paused, userPaused, intervalMs, step]);

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => window.setTimeout(() => setPaused(false), 4000)}>
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {React.Children.map(children, (child) => (
          <div className="flex w-[78vw] shrink-0 snap-start items-start sm:w-[280px] lg:w-[300px] [&>*]:w-full">{child}</div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <button type="button" aria-label="Previous reviews" onClick={() => step(-1)} className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 backdrop-blur transition hover:border-amber-400/60 hover:text-amber-300">
          <ArrowLeft className="size-4" />
        </button>
        <button type="button" aria-label={userPaused ? "Play auto-scroll" : "Pause auto-scroll"} onClick={() => setUserPaused((v) => !v)} className="flex size-9 items-center justify-center rounded-full border border-amber-400/50 bg-amber-400/10 text-amber-300 transition hover:bg-amber-400/20">
          {userPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </button>
        <button type="button" aria-label="Next reviews" onClick={() => step(1)} className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 backdrop-blur transition hover:border-amber-400/60 hover:text-amber-300">
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
