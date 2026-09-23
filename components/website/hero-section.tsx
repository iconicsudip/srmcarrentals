import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";

import type { HomepageContent } from "@/modules/settings/site-content.schemas";
import { resolveIcon } from "@/lib/icon-map";
import { stripTrailingPunctuation } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookingWidget } from "@/components/website/booking-widget";

export function HeroSection({
  content,
  locations,
}: {
  content: HomepageContent["hero"];
  locations: { id: string; name: string }[];
}) {
  const cleanTitle = stripTrailingPunctuation(content.title);
  const titleParts = content.highlightWord ? cleanTitle.split(content.highlightWord) : [cleanTitle, ""];
  const heroImageSrc = content.backgroundImageUrl || "/images/hero-car-bg.jpg";

  return (
    <section className="relative overflow-hidden bg-neutral-950">
      {/* ── Background Hero Image ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <Image
          src={heroImageSrc}
          alt="Luxury Fleet Self-Drive & Chauffeur"
          fill
          priority
          quality={92}
          sizes="100vw"
          className="object-cover object-[center_35%] opacity-55 scale-100"
        />
        {/* Cinematic gradient overlays for contrast and luxury mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-neutral-950/40 to-neutral-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-black/50" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pt-20 pb-10 text-center sm:px-6 sm:pt-28">
        {content.badge && (
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-widest text-white/80">
            {content.badge}
          </span>
        )}

        <h1 className="text-4xl leading-[1.05] font-black tracking-tight text-white uppercase sm:text-6xl md:text-7xl">
          {titleParts[0]}
          {content.highlightWord && <span className="text-white/40">{content.highlightWord}</span>}
          {titleParts[1]}
          <span className="text-orange-500">.</span>
        </h1>

        {content.subtitle && (
          <p className="mt-6 max-w-2xl text-base text-white/60 sm:text-lg">{content.subtitle}</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-orange-500 font-bold text-white hover:bg-orange-600">
            <Link href={content.primaryCtaHref}>
              {content.primaryCtaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            <Link href={content.secondaryCtaHref}>
              <Compass className="size-4" />
              {content.secondaryCtaLabel}
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <BookingWidget locations={locations} />
      </div>
    </section>
  );
}

export function TrustBadgeRow({ badges }: { badges: HomepageContent["trustBadges"] }) {
  if (badges.length === 0) return null;

  return (
    <div className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 text-sm text-white/60 sm:px-6 lg:px-8">
        {badges.map((badge, i) => {
          const Icon = resolveIcon(badge.icon);
          return (
            <span key={i} className="flex items-center gap-2">
              <Icon className="size-4 text-orange-500" />
              {badge.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
