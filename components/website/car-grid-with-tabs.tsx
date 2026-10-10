"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";

import { CarCard, type CarCardData } from "@/components/website/car-card";
import { cn } from "@/lib/utils";

interface TabDef {
  id: string;
  label: string;
  count?: number;
}

interface CarGridWithTabsProps<T extends CarCardData & { tabId: string }> {
  cars: T[];
  tabs: TabDef[];
  viewAllHref: string;
  totalCount: number;
  initialLimit?: number;
  centerTabs?: boolean;
  /** When true, cars render in a horizontally-scrollable carousel */
  scrollRow?: boolean;
  /** When true, cards are rendered in 2 stacked rows per carousel slide/column */
  twoRows?: boolean;
  /** When true, only show 1-day base price on the cards */
  showBasePriceOnly?: boolean;
}

const CARD_GAP = 20; // px — gap between cards
const AUTO_DELAY = 3500; // ms — auto-advance interval

/** `tabId` must be precomputed server-side (e.g. category.id or brand.id) */
export function CarGridWithTabs<T extends CarCardData & { tabId: string }>({
  cars,
  tabs,
  viewAllHref,
  totalCount,
  initialLimit,
  centerTabs = false,
  scrollRow = false,
  twoRows = false,
  showBasePriceOnly = false,
}: CarGridWithTabsProps<T>) {
  const [activeTab, setActiveTab] = React.useState("all");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const effectiveLimit = initialLimit ?? (twoRows ? 16 : 8);
  const filtered = activeTab === "all" ? cars : cars.filter((c) => c.tabId === activeTab);
  const visible = filtered.slice(0, effectiveLimit);

  // Group into pairs for 2-row display
  const pairedCars = React.useMemo(() => {
    if (!twoRows) return [];
    const pairs: T[][] = [];
    for (let i = 0; i < visible.length; i += 2) {
      pairs.push(visible.slice(i, i + 2));
    }
    return pairs;
  }, [visible, twoRows]);

  const totalItems = twoRows ? pairedCars.length : visible.length;
  const [visibleCount, setVisibleCount] = React.useState(1);

  // Dynamically calculate how many cards/columns fit in the container
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
  }, [updateVisibleCount, totalItems, activeTab]);

  // Dots count is properly calculated based on: total cards / visible cards per view
  const dotCount = Math.max(1, Math.ceil(totalItems / visibleCount));

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

  // Auto-play timer
  React.useEffect(() => {
    if ((!scrollRow && !twoRows) || !playing || dotCount <= 1) return;
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
  }, [scrollRow, twoRows, playing, dotCount, scrollTo]);

  // Reset on tab change
  React.useEffect(() => {
    setActiveIdx(0);
    scrollRef.current?.scrollTo({ left: 0 });
    updateVisibleCount();
  }, [activeTab, updateVisibleCount]);

  // Track active index from scroll position
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

  return (
    <div className="w-full flex flex-col gap-6">

      {/* ── Category / Brand pills ── */}
      <div className={cn("flex flex-wrap gap-2", centerTabs && "justify-center")}>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
              : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 shadow-xs"
          }`}
        >
          ALL
          <span className={`min-w-[18px] rounded-full px-1.5 text-center text-[10px] font-black leading-[18px] ${
            activeTab === "all" ? "bg-white/25 text-white" : "bg-neutral-100 text-neutral-600"
          }`}>
            {totalCount}
          </span>
        </button>

        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 shadow-xs"
            }`}
          >
            {tab.label.toUpperCase()}
            {typeof tab.count === "number" && (
              <span className={`min-w-[18px] rounded-full px-1.5 text-center text-[10px] font-black leading-[18px] ${
                activeTab === tab.id ? "bg-white/25 text-white" : "bg-neutral-100 text-neutral-600"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Car display ── */}
      {visible.length === 0 ? (
        <p className="py-12 text-center text-neutral-500 font-medium">No cars in this category yet — check back soon.</p>
      ) : twoRows ? (
        /* ── 2-Row Carousel (Pairs stacked vertically in columns) ── */
        <div className="flex flex-col gap-4">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onMouseEnter={() => setPlaying(false)}
            onMouseLeave={() => setPlaying(true)}
            className="flex overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", gap: CARD_GAP }}
          >
            {pairedCars.map((pair, colIdx) => (
              <div
                key={colIdx}
                className="shrink-0 flex flex-col gap-4 w-[285px] sm:w-[330px] md:w-[360px] max-w-full"
                style={{ scrollSnapAlign: "start" }}
              >
                {pair.map((car) => (
                  <div key={car.id} className="h-full">
                    <CarCard car={car} variant="compact" showBasePriceOnly={showBasePriceOnly} />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: dotCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to slide ${i + 1} of ${dotCount}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    i === activeIdx ? "w-6 h-2 bg-orange-500" : "w-2 h-2 bg-neutral-300 hover:bg-neutral-400"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollTo(activeIdx - 1)}
                disabled={dotCount <= 1 || activeIdx <= 0}
                className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-30 cursor-pointer shadow-xs"
                aria-label="Previous"
              >
                <ArrowLeft className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setPlaying((v) => !v)}
                className="flex size-8 items-center justify-center rounded-full border border-orange-500/40 bg-orange-50 text-orange-600 transition hover:bg-orange-100 cursor-pointer shadow-xs"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => scrollTo(activeIdx + 1)}
                disabled={dotCount <= 1 || activeIdx >= dotCount - 1}
                className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-30 cursor-pointer shadow-xs"
                aria-label="Next"
              >
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : scrollRow ? (
        /* ── Auto-playing wide single-car carousel ── */
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
            {visible.map((car) => (
              <div
                key={car.id}
                className="shrink-0 w-[92vw] sm:w-[680px] md:w-[800px] lg:w-[940px] max-w-full"
                style={{
                  scrollSnapAlign: "start",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CarCard car={car} showBasePriceOnly={showBasePriceOnly} />
              </div>
            ))}
          </div>

          {/* ── Carousel controls ── */}
          <div className="flex items-center justify-between px-1">
            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: dotCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Go to slide ${i + 1} of ${dotCount}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    i === activeIdx
                      ? "w-6 h-2 bg-orange-500"
                      : "w-2 h-2 bg-neutral-300 hover:bg-neutral-400"
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
                className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-30 cursor-pointer shadow-xs"
                aria-label="Previous"
              >
                <ArrowLeft className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setPlaying((v) => !v)}
                className="flex size-8 items-center justify-center rounded-full border border-orange-500/40 bg-orange-50 text-orange-600 transition hover:bg-orange-100 cursor-pointer shadow-xs"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => scrollTo(activeIdx + 1)}
                disabled={dotCount <= 1 || activeIdx >= dotCount - 1}
                className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950 disabled:opacity-30 cursor-pointer shadow-xs"
                aria-label="Next"
              >
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Full width single-car list ── */
        <div className="w-full flex flex-col gap-6">
          {visible.map((car) => (
            <CarCard key={car.id} car={car} showBasePriceOnly={showBasePriceOnly} />
          ))}
        </div>
      )}

      {/* ── View all CTA ── */}
      <Link
        href={viewAllHref}
        className="mx-auto flex w-fit items-center gap-2 rounded-full border border-neutral-300/80 bg-white px-6 py-3 text-sm font-bold text-neutral-900 shadow-sm transition hover:border-orange-500/50 hover:bg-neutral-50 hover:text-orange-950"
      >
        View All {totalCount} Cars in Fleet
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
