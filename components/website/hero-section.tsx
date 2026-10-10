import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

import type { HomepageContent, AvailableServicesConfig } from "@/modules/settings/site-content.schemas";
import { resolveIcon } from "@/lib/icon-map";
import { stripTrailingPunctuation } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookingWidget } from "@/components/website/booking-widget";

export function HeroSection({
  content,
  locations,
  services,
}: {
  content: HomepageContent["hero"];
  locations: { id: string; name: string }[];
  services?: AvailableServicesConfig;
}) {
  const cleanTitle = stripTrailingPunctuation(content.title);
  const titleParts = content.highlightWord ? cleanTitle.split(content.highlightWord) : [cleanTitle, ""];
  const heroImageSrc = content.backgroundImageUrl || "/images/hero-car-bg.jpg";

  return (
    <section className="relative bg-[#FAFAFC] overflow-hidden">
      {/* ── Background Hero Image & Ambient Warm Flares ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <Image
          src={heroImageSrc}
          alt="Luxury Fleet Self-Drive & Chauffeur"
          fill
          priority
          quality={92}
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-20 scale-100 transition-transform duration-1000 ease-out"
        />
        {/* Soft luminous gradient overlays for crisp contrast and luxury mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/85 to-[#FAFAFC]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />

        {/* Ambient Warm Amber Halo behind the center */}
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pt-20 pb-10 text-center sm:px-6 sm:pt-28">
        {content.badge && (
          <span className="shimmer-sheen mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-700 backdrop-blur-md shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_6px_#f97316]" />
            {content.badge}
          </span>
        )}

        <h1 className="text-4xl leading-[1.05] font-black tracking-tight text-neutral-950 uppercase sm:text-6xl md:text-7xl">
          {titleParts[0]}
          {content.highlightWord && (
            <span className="text-gradient-gold">
              {content.highlightWord}
            </span>
          )}
          {titleParts[1]}
          <span className="text-orange-500 animate-pulse">.</span>
        </h1>

        {content.subtitle && (
          <p className="mt-6 max-w-2xl text-base text-neutral-600 sm:text-lg font-normal leading-relaxed">
            {content.subtitle}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="shimmer-sheen relative bg-orange-500 font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Link href={content.primaryCtaHref}>
              {content.primaryCtaLabel}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="luxury-glass border-neutral-300/80 bg-white/80 text-neutral-800 backdrop-blur-md transition-all duration-300 hover:border-orange-500/40 hover:bg-white hover:text-neutral-950 hover:-translate-y-0.5 active:translate-y-0 shadow-xs"
          >
            <Link href={content.secondaryCtaHref}>
              <Compass className="size-4 text-orange-500" />
              {content.secondaryCtaLabel}
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1520px] px-4 pb-16 sm:px-6 lg:px-8">
        <BookingWidget locations={locations} services={services} />
      </div>
    </section>
  );
}

export function TrustBadgeRow({ badges }: { badges: HomepageContent["trustBadges"] }) {
  if (badges.length === 0) return null;

  return (
    <div className="border-y border-neutral-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-5 text-sm text-neutral-700 sm:px-6 lg:px-8">
        {badges.map((badge, i) => {
          const Icon = resolveIcon(badge.icon);
          return (
            <span
              key={i}
              className="flex items-center gap-2.5 rounded-full border border-neutral-200/90 bg-white px-4 py-1.5 transition-all duration-300 hover:border-orange-500/40 hover:bg-orange-50/50 hover:text-neutral-950 shadow-xs"
            >
              <Icon className="size-4 text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.3)]" />
              <span className="font-semibold text-xs sm:text-sm tracking-wide text-neutral-800">{badge.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
