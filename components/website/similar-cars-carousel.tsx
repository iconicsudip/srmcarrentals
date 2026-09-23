"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";

import { CarCard, type CarCardData } from "@/components/website/car-card";

interface SimilarCarsCarouselProps {
  cars: CarCardData[];
}

const CARD_GAP = 20; // px
const AUTO_DELAY = 3500; // ms

export function SimilarCarsCarousel({ cars }: SimilarCarsCarouselProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(1);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const total = cars.length;

  // Dynamically calculate how many cards fit in the viewport
  const updateVisibleCount = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.children.length) return;
    const containerWidth = el.clientWidth;
    const firstChild = el.children[0] as HTMLElement;
    const itemWidth = firstChild.offsetWidth;
    if (itemWidth > 0) {
      const gap = CARD_GAP;
      const count = Math.max(1, Math.floor((containerWidth + gap * 0.5) / (itemWidth + gap)));
      setVisibleCount(count);
    }
  }, []);

  React.useEffect(() => {
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [updateVisibleCount, total]);

  // Dots count is properly calculated based on: total cards / visible cards per view
  const dotCount = Math.max(1, Math.ceil(total / visibleCount));

  // Scroll to a specific dot / page
  const scrollTo = React.useCallback(
    (dotIdx: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const targetDot = Math.max(0, Math.min(dotIdx, dotCount - 1));
      setActiveIdx(targetDot);

      // If on the last dot, scroll to maximum scrollable position
      if (targetDot === dotCount - 1) {
        el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: "smooth" });
        return;
      }

      const targetItemIdx = targetDot * visibleCount;
      const cardEl = el.children[targetItemIdx] as HTMLElement | undefined;
      if (cardEl) {
        el.scrollTo({ left: cardEl.offsetLeft - el.offsetLeft, behavior: "smooth" });
      } else {
        el.scrollTo({ left: targetDot * el.clientWidth, behavior: "smooth" });
      }
    },
    [dotCount, visibleCount],
  );

  // Auto-play timer (same as home page carousel)
  React.useEffect(() => {
    if (!playing || dotCount <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => {
        const next = prev >= dotCount - 1 ? 0 : prev + 1;
        scrollTo(next);
        return next;
      });
    }, AUTO_DELAY);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, dotCount, scrollTo]);

  // Track active dot from scroll position
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !el.children.length) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 5) {
      setActiveIdx(0);
      return;
    }
    if (scrollLeft >= maxScroll - 15) {
      setActiveIdx(dotCount - 1);
      return;
    }
    const pageFraction = scrollLeft / (el.clientWidth || 1);
    const currentDot = Math.max(0, Math.min(Math.round(pageFraction), dotCount - 1));
    setActiveIdx(currentDot);
  };

  if (cars.length === 0) return null;

  return (
    <section className="w-full flex flex-col gap-6">
      {/* ── Section Heading ── */}
      <div>
        <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[11px] font-bold tracking-widest text-orange-400 uppercase">
          RECOMMENDED FLEET
        </span>
        <h2 className="mt-3 text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
          SIMILAR CARS<span className="text-orange-500">.</span>
        </h2>
        <p className="mt-1 text-sm text-white/50">
          Explore alternative self-drive vehicles available in this category.
        </p>
      </div>

      {/* ── Auto-playing Wide Single-Car Carousel (Same as Home Page Carousel) ── */}
      <div className="flex flex-col gap-4">
        {/* Scroll container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseEnter={() => setPlaying(false)}
          onMouseLeave={() => setPlaying(true)}
          className="flex overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", gap: CARD_GAP }}
        >
          {cars.map((car) => (
            <div
              key={car.id}
              className="shrink-0 w-[92vw] sm:w-[680px] md:w-[800px] lg:w-[940px] max-w-full"
              style={{
                scrollSnapAlign: "start",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CarCard car={car} variant="wide" />
            </div>
          ))}
        </div>

        {/* ── Carousel Controls (Dots + Prev / Play-Pause / Next) ── */}
        <div className="flex items-center justify-between px-1">
          {/* Dot indicators properly calculated based on visible total cards */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: dotCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Go to slide ${i + 1} of ${dotCount}`}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? "w-6 h-2 bg-orange-500"
                    : "w-2 h-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Prev / Play-Pause / Next */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollTo(activeIdx - 1)}
              disabled={dotCount <= 1 || activeIdx <= 0}
              className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label="Previous"
            >
              <ArrowLeft className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setPlaying((v) => !v)}
              className="flex size-8 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/15 text-orange-400 transition hover:bg-orange-500/25"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => scrollTo(activeIdx + 1)}
              disabled={dotCount <= 1 || activeIdx >= dotCount - 1}
              className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label="Next"
            >
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── View All CTA (Same as Home Page Carousel) ── */}
      <Link
        href="/cars"
        className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        View All Cars in Fleet
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}
