"use client";

import * as React from "react";

import { TestimonialCard, type TestimonialData } from "@/components/website/testimonial-card";

function MarqueeRow({ items, reverse = false }: { items: TestimonialData[]; reverse?: boolean }) {
  if (items.length === 0) return null;
  // Content is doubled so the loop is seamless (the animation travels exactly half the track).
  const loop = [...items, ...items];
  return (
    <div
      className="review-marquee-wrap relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]"
    >
      <div
        className={`review-marquee flex w-max items-stretch gap-5 py-2 ${reverse ? "review-marquee-reverse" : ""}`}
        style={{ ["--marquee-duration" as string]: `${Math.max(40, items.length * 6)}s` }}
      >
        {loop.map((t, i) => (
          <div key={`${t.id}-${i}`} aria-hidden={i >= items.length} className="h-[238px] w-[250px] shrink-0 sm:w-[290px]">
            <TestimonialCard t={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Two rows of reviews drifting in opposite directions (top row left, bottom row right); pause on hover. */
export function ReviewsCarousel({ initial }: { initial: TestimonialData[]; total?: number }) {
  const rows = React.useMemo(() => {
    const top: TestimonialData[] = [];
    const bottom: TestimonialData[] = [];
    initial.forEach((t, i) => (i % 2 === 0 ? top : bottom).push(t));
    // With very few reviews, show the same set in both rows so neither row looks empty.
    return initial.length < 6 ? { top: initial, bottom: [...initial].reverse() } : { top, bottom };
  }, [initial]);

  return (
    <div className="flex flex-col gap-5">
      <MarqueeRow items={rows.top} />
      <MarqueeRow items={rows.bottom} reverse />
    </div>
  );
}
