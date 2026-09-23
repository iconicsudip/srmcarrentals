"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Star, Zap } from "lucide-react";

import { SectionHeading } from "@/components/website/section-heading";

interface CategoryCardsProps {
  counts: { carCount: number; chauffeurCount: number; tourCount: number };
}

const CARDS = [
  {
    eyebrow: "Self Drive Fleet",
    title: "Self Drive",
    href: "/cars",
    rating: 5.0,
    reviews: "340+",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80&auto=format&fit=crop",
  },
  {
    eyebrow: "Executive Travel",
    title: "Chauffeur Taxi",
    href: "/car-rental",
    rating: 4.9,
    reviews: "520+",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
  },
  {
    eyebrow: "Rajasthan Expeditions",
    title: "Royal Tours",
    href: "/tours",
    rating: 5.0,
    reviews: "213",
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop",
  },
];

export function CategoryCardsSection({ counts }: CategoryCardsProps) {
  const metaCounts = [counts.carCount, counts.chauffeurCount, counts.tourCount];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading badge="SRM 3D CATEGORIES" title="CHOOSE YOUR DRIVE." center />

      {/* Single horizontal auto-scroll row — snaps on mobile, full row on desktop */}
      <div
        className="mt-12 flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {CARDS.map((card, idx) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative flex h-[480px] w-[min(80vw,360px)] shrink-0 flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 lg:flex-1 lg:w-0"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Full-bleed background image */}
            <Image
              src={card.image}
              alt={card.title}
              fill
              sizes="(max-width: 640px) 80vw, 360px"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Gradient overlay — strong at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

            {/* Top-left: SRM badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-black tracking-widest text-white backdrop-blur">
              <Zap className="size-2.5 fill-white" />
              SRM
            </div>

            {/* Top-right: heart icon */}
            <button
              type="button"
              aria-label="Save"
              onClick={(e) => e.preventDefault()}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/60 backdrop-blur transition hover:bg-black/60 hover:text-white"
            >
              <Heart className="size-3.5" />
            </button>

            {/* Bottom content */}
            <div className="relative flex flex-col gap-3 p-5">
              <div>
                <p className="text-xs font-medium text-white/60">{card.eyebrow}</p>
                <h3 className="mt-0.5 text-3xl font-black text-white">{card.title}</h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/70">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-white">{card.rating.toFixed(1)}</span>
                <span>{card.reviews} Reviews</span>
                {metaCounts[idx] != null && (metaCounts[idx] as number) > 0 && (
                  <span className="ml-auto text-white/40">{metaCounts[idx]} Available</span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur transition group-hover:bg-white/15">
                <span className="text-sm font-semibold text-white">See More</span>
                <span className="flex size-7 items-center justify-center rounded-full bg-white text-black">
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
