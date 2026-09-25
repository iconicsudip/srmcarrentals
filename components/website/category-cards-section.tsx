"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, Zap } from "lucide-react";

import { SectionHeading } from "@/components/website/section-heading";
import type { AvailableServicesConfig } from "@/modules/settings/site-content.schemas";

interface CategoryCardsProps {
  counts: { carCount: number; chauffeurCount: number; tourCount: number };
  services?: AvailableServicesConfig;
}

const CARDS = [
  {
    key: "cars",
    eyebrow: "Self Drive Fleet",
    title: "Self Drive",
    href: "/cars",
    ctaLabel: "Explore Fleet",
    rating: 5.0,
    reviews: "340+",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80&auto=format&fit=crop",
  },
  {
    key: "taxi",
    eyebrow: "Executive Travel",
    title: "Chauffeur Taxi",
    href: "/car-rental",
    ctaLabel: "Book Chauffeur",
    rating: 4.9,
    reviews: "520+",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
  },
  {
    key: "tours",
    eyebrow: "Rajasthan Expeditions",
    title: "Royal Tours",
    href: "/tours",
    ctaLabel: "Explore Curated Tours",
    rating: 5.0,
    reviews: "213",
    image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop",
  },
];

export function CategoryCardsSection({
  counts,
  services = { cars: true, taxi: true, tours: true },
}: CategoryCardsProps) {
  const metaCounts: Record<string, number> = {
    cars: counts.carCount,
    taxi: counts.chauffeurCount,
    tours: counts.tourCount,
  };

  const visibleCards = React.useMemo(() => {
    return CARDS.filter((card) => {
      if (card.key === "cars") return services.cars !== false;
      if (card.key === "taxi") return services.taxi !== false;
      if (card.key === "tours") return services.tours !== false;
      return true;
    });
  }, [services]);

  if (visibleCards.length === 0) return null;

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
        {visibleCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative flex h-[490px] w-[min(82vw,370px)] shrink-0 flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 lg:flex-1 lg:w-0 luxury-card-hover hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Full-bleed background image with slow cinematic zoom */}
            <Image
              src={card.image}
              alt={card.title}
              fill
              sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 380px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Gradient overlay — smooth fade to black at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

            {/* Top-left: Sleek SRM badge pill */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-black/60 px-3 py-1.5 text-[11px] font-black tracking-widest text-white backdrop-blur-md shadow-lg">
              <Zap className="size-3 fill-orange-400 text-orange-400" />
              <span>SRM</span>
            </div>

            {/* Top-right: Live Availability Pill (replaces old favorite heart button) */}
            {metaCounts[card.key] != null && (metaCounts[card.key] ?? 0) > 0 ? (
              <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-black/60 px-3 py-1.5 text-[11px] font-bold text-emerald-400 backdrop-blur-md shadow-lg">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{metaCounts[card.key]} Available</span>
              </div>
            ) : null}

            {/* Bottom content */}
            <div className="relative z-10 flex flex-col gap-3.5 p-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-orange-400 uppercase">{card.eyebrow}</p>
                <h3 className="mt-0.5 text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">{card.title}</h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-white/80">
                <div className="flex items-center gap-1">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-white">{card.rating.toFixed(1)}</span>
                </div>
                <span className="text-white/40">•</span>
                <span className="text-white/60">({card.reviews} Reviews)</span>
              </div>

              {/* Bottom CTA Button */}
              <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 backdrop-blur-md transition-all duration-300 group-hover:border-orange-500 group-hover:bg-orange-500 group-hover:shadow-lg group-hover:shadow-orange-500/30">
                <span className="text-sm font-bold tracking-wide text-white">{card.ctaLabel}</span>
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
