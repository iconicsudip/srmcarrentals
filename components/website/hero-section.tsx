import Link from "next/link";
import { ArrowRight, Compass, MapPin, Plane } from "lucide-react";

import type { HomepageContent, AvailableServicesConfig } from "@/modules/settings/site-content.schemas";
import { resolveIcon } from "@/lib/icon-map";
import { stripTrailingPunctuation } from "@/lib/utils";
import { HeroCarousel } from "@/components/website/hero-carousel";
import { BookingWidget } from "@/components/website/booking-widget";

const DEFAULT_EXTRA_SLIDES = [
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2000&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=2000&q=80&auto=format&fit=crop",
];

export function HeroSection({
  content,
  locations,
  services,
  carCount,
}: {
  content: HomepageContent["hero"];
  locations: { id: string; name: string }[];
  services?: AvailableServicesConfig;
  carCount?: number;
}) {
  const cleanTitle = stripTrailingPunctuation(content.title);
  const titleParts = content.highlightWord ? cleanTitle.split(content.highlightWord) : [cleanTitle, ""];
  const slides = Array.from(
    new Set([content.backgroundImageUrl || "/images/hero-car-bg.jpg", ...(content.backgroundImages ?? [])].filter(Boolean)),
  );
  // Out of the box (nothing configured in admin) still show a multi-image carousel.
  const carouselImages = slides.length > 1 ? slides : [...slides, ...DEFAULT_EXTRA_SLIDES];
  const pickupPoints = locations.slice(0, 5);

  const stats = [
    carCount && carCount > 0 ? { value: `${carCount}+`, label: "Cars in fleet" } : null,
    locations.length > 0 ? { value: String(locations.length), label: "Pickup cities" } : null,
    { value: "24/7", label: "Road support" },
  ].filter((x): x is { value: string; label: string } => x !== null);

  return (
    <section className="relative overflow-hidden bg-neutral-950 pb-6 [clip-path:none] lg:pb-14 lg:[clip-path:polygon(0_0,100%_0,100%_calc(100%-56px),0_100%)]">
      {/* ── Photography: full-bleed, framed to the right so the cars stay visible ── */}
      <div className="absolute inset-0 select-none">
        <HeroCarousel images={carouselImages} />
        <div className="pointer-events-none absolute inset-0">
        {/* Left-weighted scrim: copy stays legible, the right side keeps the photo vivid */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-neutral-950/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/70 via-transparent to-neutral-950/90" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-orange-600/25 to-transparent" />
        {/* Oversized outline wordmark for depth */}
        <span
          aria-hidden
          className="absolute -bottom-6 -left-4 hidden text-[15rem] leading-none font-black tracking-tighter text-transparent select-none lg:block [-webkit-text-stroke:1px_rgba(255,255,255,0.07)]"
        >
          SRM
        </span>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-[1520px] items-center gap-12 px-4 pt-14 pb-10 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-16 lg:px-8 lg:pt-24">
        {/* ── LEFT: editorial copy ── */}
        <div className="max-w-3xl">
          {content.badge && (
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-amber-400 to-transparent" />
              <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.28em] text-amber-300 uppercase">
                <span className="size-1.5 animate-pulse rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
                {content.badge}
              </span>
            </div>
          )}

          <h1 className="text-[2.75rem] leading-[0.95] font-black tracking-tight text-white uppercase drop-shadow-[0_2px_24px_rgba(0,0,0,0.5)] sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
            {titleParts[0]}
            {content.highlightWord && (
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  {content.highlightWord}
                </span>
                {/* Hand-drawn underline stroke */}
                <svg
                  aria-hidden
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 left-0 h-2.5 w-full text-orange-500"
                >
                  <path d="M2 8 C 40 2, 90 12, 130 6 S 185 4, 198 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            )}
            {titleParts[1]}
            <span className="text-orange-500">.</span>
          </h1>

          {content.subtitle && (
            <p className="mt-8 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{content.subtitle}</p>
          )}

          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href={content.primaryCtaHref}
              className="shimmer-sheen group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 py-2 pr-2 pl-7 text-sm font-black text-white shadow-xl shadow-orange-500/30 transition hover:shadow-orange-500/50"
            >
              {content.primaryCtaLabel}
              <span className="flex size-10 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight className="size-4" />
              </span>
            </Link>
            <Link
              href={content.secondaryCtaHref}
              className="group inline-flex items-center gap-2 text-sm font-bold text-white/90 transition hover:text-amber-300"
            >
              <Compass className="size-4 text-amber-400" />
              <span className="border-b border-white/30 pb-0.5 transition group-hover:border-amber-300">
                {content.secondaryCtaLabel}
              </span>
            </Link>
          </div>

          {/* Proof strip */}
          <dl className="mt-12 flex max-w-xl flex-wrap gap-x-10 gap-y-5 border-t border-white/15 pt-7">
            {stats.map((st) => (
              <div key={st.label}>
                <dt className="text-3xl font-black tracking-tight text-white">{st.value}</dt>
                <dd className="mt-0.5 text-[11px] font-semibold tracking-widest text-white/55 uppercase">{st.label}</dd>
              </div>
            ))}
          </dl>

          {/* Phones: pickup cities as chips (the key card below is desktop-only) */}
          {pickupPoints.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-2 lg:hidden">
              {pickupPoints.slice(0, 4).map((l) => (
                <span key={l.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
                  <MapPin className="size-3 text-amber-400" /> {l.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: "route" key card — real pickup points on a dotted line ── */}
        {pickupPoints.length > 0 && (
          <aside className="relative hidden justify-self-end lg:mr-14 lg:block lg:w-full lg:max-w-[360px]">
            <div className="lux-ring absolute -inset-10 rounded-full opacity-60" aria-hidden />
            <div className="relative rounded-[28px] border border-white/20 bg-neutral-950/50 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.25em] text-amber-300 uppercase">Pickup points</span>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
                </span>
              </div>

              <ol className="relative mt-6 space-y-5">
                {/* dotted route line */}
                <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-[repeating-linear-gradient(to_bottom,rgba(251,191,36,0.7)_0_4px,transparent_4px_9px)]" />
                {pickupPoints.map((l, i) => (
                  <li key={l.id} className="relative flex items-center gap-4 pl-7">
                    <span
                      className={`absolute left-0 size-[15px] rounded-full border-2 ${
                        i === 0 ? "border-orange-500 bg-orange-500 shadow-[0_0_12px_#f97316]" : "border-amber-300 bg-neutral-950"
                      }`}
                    />
                    <span className="text-sm font-bold text-white">{l.name}</span>
                    {i === 0 && (
                      <span className="ml-auto rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-bold tracking-wider text-orange-300 uppercase">
                        Start
                      </span>
                    )}
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 text-[11px] leading-snug text-white/70">
                <Plane className="size-4 shrink-0 text-amber-300" />
                Delivery to Airport, Railway Station or Hotel
              </div>
            </div>
          </aside>
        )}
      </div>

      <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
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
