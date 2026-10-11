"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { GoogleLogo } from "@/components/website/testimonial-card";

import { ReviewsCarousel } from "@/components/website/reviews-carousel";
import type { TestimonialData } from "@/components/website/testimonial-card";

export type { TestimonialData };

export function TestimonialsSection({
  testimonials,
  heading = {
    badge: "VERIFIED EXPERIENCES",
    title: "DRIVEN BY TRUST.",
    subtitle: "Stories from travellers who chose us for the road ahead — verified on Google.",
  },
}: {
  testimonials: TestimonialData[];
  heading?: { badge: string; title: string; subtitle?: string };
}) {
  if (testimonials.length === 0) return null;

  const total = testimonials.length;
  const average = testimonials.reduce((sum, t) => sum + (t.rating || 0), 0) / total;
  const fiveStar = testimonials.filter((t) => t.rating >= 5).length;
  const fivePct = Math.round((fiveStar / total) * 100);
  const googleCount = testimonials.filter((t) => t.source === "google").length;

  return (
    <section className="relative overflow-hidden bg-neutral-950 text-white">
      {/* ambient glows + oversized outlined word */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[64rem] max-w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.22),transparent_65%)]" aria-hidden />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-[28rem] bg-[radial-gradient(circle,rgba(251,191,36,0.12),transparent_65%)]" aria-hidden />
      <span
        aria-hidden
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 text-[20vw] leading-none font-black tracking-tighter whitespace-nowrap text-transparent select-none [-webkit-text-stroke:1px_rgba(255,255,255,0.05)] lg:text-[15rem]"
      >
        REVIEWS
      </span>

      <div className="relative mx-auto max-w-[1520px] px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        {/* Heading + rating panel */}
        <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-white/10 px-3.5 py-1 text-[11px] font-bold tracking-[0.25em] text-amber-300 uppercase backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" /> {heading.badge}
            </span>
            <h2 className="mt-4 text-4xl leading-[1.02] font-black tracking-tight uppercase sm:text-6xl">
              {heading.title.replace(/\.$/, "")}
              <span className="text-orange-500">.</span>
            </h2>
            <span className="lux-rule mt-4 block" />
            {heading.subtitle && <p className="mt-4 max-w-xl text-base text-white/65">{heading.subtitle}</p>}
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
            <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
            <div className="flex items-center gap-6">
              <div>
                <div className="bg-gradient-to-br from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-6xl leading-none font-black tracking-tighter text-transparent sm:text-7xl">
                  {average.toFixed(1)}
                </div>
                <div className="mt-2 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-5 ${i < Math.round(average) ? "fill-amber-400 text-amber-400" : "fill-white/15 text-white/15"}`} />
                  ))}
                </div>
              </div>
              <div className="min-w-0 flex-1 border-l border-white/10 pl-6">
                <div className="text-3xl font-black">{total.toLocaleString("en-IN")}</div>
                <div className="text-xs font-semibold tracking-widest text-white/55 uppercase">
                  {googleCount > 0 ? "Google reviews" : "Happy customers"}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-white">
                    <GoogleLogo className="size-3.5" />
                  </span>
                  {fivePct}% rated 5 stars
                </div>
              </div>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500" style={{ width: `${fivePct}%` }} />
            </div>
          </div>
        </div>

        {/* All reviews: swipeable, auto-advancing row (loads more as you scroll) */}
        <div className="mt-14">
          <ReviewsCarousel initial={testimonials.slice(0, 48)} total={total} />
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/reviews"
            className="group inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/10 px-7 py-3 text-sm font-black tracking-wide text-amber-200 transition hover:bg-amber-400 hover:text-neutral-950"
          >
            See all {total.toLocaleString("en-IN")} reviews
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
