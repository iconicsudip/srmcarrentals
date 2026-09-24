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
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      {/* Subtle ambient lighting behind categories */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/[0.06] rounded-full blur-[140px] pointer-events-none" />

      <SectionHeading badge="SRM 3D CATEGORIES" title="CHOOSE YOUR DRIVE." center />

      {/* Single horizontal auto-scroll row — snaps on mobile, full row on desktop */}
      <div
        className="mt-12 flex gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {CARDS.map((card, idx) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative flex h-[490px] w-[min(82vw,370px)] shrink-0 flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 lg:flex-1 lg:w-0 luxury-card-hover hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Full-bleed background image with slow cinematic zoom */}
            <Image
              src={card.image}
              alt={card.title}
              fill
              sizes="(max-width: 640px) 80vw, 360px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />

            {/* Gradient overlay — strong at bottom with warm tint */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 transition-opacity duration-300 group-hover:opacity-90" />

            {/* Top-left: SRM badge */}
            <div className="shimmer-sheen absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black tracking-widest text-white shadow-md shadow-orange-500/30 backdrop-blur">
              <Zap className="size-2.5 fill-white" />
              SRM
            </div>

            {/* Top-right: heart icon */}
            <button
              type="button"
              aria-label="Save"
              onClick={(e) => e.preventDefault()}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white/70 backdrop-blur transition-all duration-300 hover:bg-orange-500 hover:border-orange-500 hover:text-white hover:scale-110"
            >
              <Heart className="size-3.5" />
            </button>

            {/* Bottom content */}
            <div className="relative flex flex-col gap-3.5 p-6 z-10">
              <div>
                <p className="text-xs font-semibold tracking-wider text-orange-400 uppercase">{card.eyebrow}</p>
                <h3 className="mt-0.5 text-3xl font-black text-white uppercase tracking-tight">{card.title}</h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/75">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-white">{card.rating.toFixed(1)}</span>
                <span className="text-white/60">({card.reviews} Reviews)</span>
                {metaCounts[idx] != null && (metaCounts[idx] as number) > 0 && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {metaCounts[idx]} Available
                  </span>
                )}
              </div>

              <div className="shimmer-sheen flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md transition-all duration-300 group-hover:bg-orange-500 group-hover:border-orange-400 group-hover:shadow-lg group-hover:shadow-orange-500/30">
                <span className="text-sm font-bold text-white tracking-wide">Explore Fleet</span>
                <span className="flex size-7 items-center justify-center rounded-full bg-white text-black transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight className="size-3.5 text-black" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
