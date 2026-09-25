import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";

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
    <section className="relative bg-neutral-950">
      {/* ── Background Hero Image & Ambient Cinematic Flares ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <Image
          src={heroImageSrc}
          alt="Luxury Fleet Self-Drive & Chauffeur"
          fill
          priority
          quality={92}
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-55 scale-100 transition-transform duration-1000 ease-out"
        />
        {/* Cinematic gradient overlays for contrast and luxury mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-neutral-950/45 to-neutral-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/15 via-transparent to-black/60" />

        {/* Ambient Warm Halo behind the center */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[320px] bg-orange-500/15 rounded-full blur-[130px] animate-pulse-slow" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pt-20 pb-10 text-center sm:px-6 sm:pt-28">
        {content.badge && (
          <span className="shimmer-sheen mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-200 backdrop-blur-md shadow-[0_0_15px_rgba(249,115,22,0.15)]">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse shadow-[0_0_6px_#f97316]" />
            {content.badge}
          </span>
        )}

        <h1 className="text-4xl leading-[1.05] font-black tracking-tight text-white uppercase sm:text-6xl md:text-7xl drop-shadow-sm">
          {titleParts[0]}
          {content.highlightWord && (
            <span className="text-gradient-gold drop-shadow-[0_2px_12px_rgba(249,115,22,0.2)]">
              {content.highlightWord}
            </span>
          )}
          {titleParts[1]}
          <span className="text-orange-500 animate-pulse">.</span>
        </h1>

        {content.subtitle && (
          <p className="mt-6 max-w-2xl text-base text-neutral-300 sm:text-lg font-light leading-relaxed">
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
            className="luxury-glass border-white/15 bg-white/[0.04] text-white backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08] hover:-translate-y-0.5 active:translate-y-0"
          >
            <Link href={content.secondaryCtaHref}>
              <Compass className="size-4 text-orange-400" />
              {content.secondaryCtaLabel}
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <BookingWidget locations={locations} services={services} />
      </div>
    </section>
  );
}

export function TrustBadgeRow({ badges }: { badges: HomepageContent["trustBadges"] }) {
  if (badges.length === 0) return null;

  return (
    <div className="border-t border-white/[0.08] bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-5 text-sm text-neutral-300 sm:px-6 lg:px-8">
        {badges.map((badge, i) => {
          const Icon = resolveIcon(badge.icon);
          return (
            <span
              key={i}
              className="flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 transition-all duration-300 hover:border-orange-500/30 hover:bg-white/[0.05] hover:text-white"
            >
              <Icon className="size-4 text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]" />
              <span className="font-medium text-xs sm:text-sm tracking-wide">{badge.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
