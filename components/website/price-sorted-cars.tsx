"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { CarCard, type CarCardData } from "@/components/website/car-card";

/** Every car from the lowest to the highest 24-hour price, in a swipeable row. */
export function PriceSortedCars({
  cars,
  total,
  text,
}: {
  cars: CarCardData[];
  total: number;
  /** Editable in Admin → Website Content → Text & Labels → Section headings. Subtitle supports {count} {low} {high}. */
  text: { badge: string; title: string; subtitle: string };
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  if (cars.length === 0) return null;

  const priceOf = (c: CarCardData) => c.kmPlans?.[0]?.dailyPrice ?? Number(c.pricing?.dailyPrice ?? 0);
  const prices = cars.map(priceOf).filter((p) => p > 0);
  const low = prices.length ? Math.min(...prices) : 0;
  const high = prices.length ? Math.max(...prices) : 0;
  const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
  const title = text.title.replace(/[.\s]+$/, "");
  const subtitle = text.subtitle.replace("{count}", String(total)).replace("{low}", inr(low)).replace("{high}", inr(high));

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + 20) * 2, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-[1520px] px-4 pt-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.25em] text-orange-600 uppercase">{text.badge}</span>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950 uppercase sm:text-3xl">
            {title}
            <span className="text-orange-500">.</span>
          </h2>
          {subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Scroll left" onClick={() => scrollBy(-1)} className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-xs transition hover:border-orange-500/50 hover:text-orange-600">
            <ArrowLeft className="size-4" />
          </button>
          <button type="button" aria-label="Scroll right" onClick={() => scrollBy(1)} className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-xs transition hover:border-orange-500/50 hover:text-orange-600">
            <ArrowRight className="size-4" />
          </button>
          <Link href="/cars?sort=price-asc" className="ml-1 hidden rounded-full border border-orange-500/40 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-100 sm:block">
            See all →
          </Link>
        </div>
      </div>

      <div ref={ref} className="mt-6 flex gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
        {cars.map((car) => (
          <div key={car.id} className="w-[82vw] shrink-0 sm:w-[310px]" style={{ scrollSnapAlign: "start" }}>
            <CarCard car={car} variant="compact" showBasePriceOnly />
          </div>
        ))}
      </div>
    </section>
  );
}
