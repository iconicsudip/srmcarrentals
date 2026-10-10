"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Crossfading, slowly zooming background slides with a vertical progress rail. */
export function HeroCarousel({ images, intervalMs = 6500 }: { images: string[]; intervalMs?: number }) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = images.length;

  const go = React.useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  React.useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearInterval(id);
  }, [count, paused, intervalMs, index]);

  // Don't burn cycles (or advance slides) while the tab is hidden.
  React.useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === index ? "Premium fleet — hero slide" : ""}
          aria-hidden={i !== index}
          fill
          priority={i === 0}
          loading={i === 0 ? "eager" : "lazy"}
          quality={80}
          sizes="100vw"
          className={`object-cover object-[62%_50%] transition-opacity duration-[1400ms] ease-in-out ${
            i === index ? "hero-kenburns opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {count > 1 && (
        <div className="absolute top-1/2 right-3 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex lg:right-6">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md transition hover:border-amber-400 hover:text-amber-300"
          >
            <ChevronLeft className="size-4 rotate-90" />
          </button>
          <div className="flex flex-col items-center gap-2.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className="group flex h-6 w-3 items-center justify-center"
              >
                <span
                  className={`block w-[3px] rounded-full transition-all duration-500 ${
                    i === index ? "h-6 bg-gradient-to-b from-amber-300 to-orange-500" : "h-2 bg-white/40 group-hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md transition hover:border-amber-400 hover:text-amber-300"
          >
            <ChevronRight className="size-4 rotate-90" />
          </button>
          <span className="mt-1 text-[10px] font-bold tracking-widest text-white/60 tabular-nums">
            {String(index + 1).padStart(2, "0")}/{String(count).padStart(2, "0")}
          </span>
        </div>
      )}

      {/* Mobile: slim progress dots */}
      {count > 1 && (
        <div className="absolute top-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:hidden">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(i)}
              className={`h-1 rounded-full transition-all duration-500 ${i === index ? "w-6 bg-amber-400" : "w-2 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
