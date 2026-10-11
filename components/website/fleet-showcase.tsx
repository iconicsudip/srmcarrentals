"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, Check, Cog, Fuel, Pause, Play, Users } from "lucide-react";

import type { CarCardData } from "@/components/website/car-card";
import { CarWhatsAppBook } from "@/components/website/car-whatsapp-book";
import type { SiteText } from "@/modules/settings/site-content.schemas";
import { getCarFallbackImage } from "@/lib/car-fallback-image";

interface TabDef {
  id: string;
  label: string;
}

type ShowcaseCar = CarCardData & { tabId: string };

const AUTO_MS = 6000;

const imageOf = (car: ShowcaseCar) => car.images[0]?.url || getCarFallbackImage(car.brand.name, car.category?.name);

/**
 * Showroom-style fleet: one large spotlight car + a single-row filmstrip to switch between cars.
 * Dark, immersive, and the whole thing is one row — no stacked card grids.
 */
export function FleetShowcase({
  cars,
  tabs,
  viewAllHref,
  totalCount,
  text,
}: {
  cars: ShowcaseCar[];
  tabs: TabDef[];
  viewAllHref: string;
  totalCount: number;
  text: SiteText["fleet"];
}) {
  const [activeTab, setActiveTab] = React.useState("all");
  const [activeId, setActiveId] = React.useState(cars[0]?.id ?? "");
  const [playing, setPlaying] = React.useState(true);
  const [failed, setFailed] = React.useState<Record<string, boolean>>({});
  const stripRef = React.useRef<HTMLDivElement>(null);

  const list = React.useMemo(() => (activeTab === "all" ? cars : cars.filter((c) => c.tabId === activeTab)).slice(0, 20), [cars, activeTab]);
  const index = Math.max(0, list.findIndex((c) => c.id === activeId));
  const car = list[index];

  // keep selection valid when the tab changes
  React.useEffect(() => {
    if (list.length && !list.some((c) => c.id === activeId)) setActiveId(list[0]!.id);
  }, [list, activeId]);

  const go = React.useCallback(
    (delta: number) => {
      if (!list.length) return;
      setActiveId(list[(index + delta + list.length) % list.length]!.id);
    },
    [list, index],
  );

  // auto-advance (restarts whenever the selection changes)
  React.useEffect(() => {
    if (!playing || list.length < 2) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(1), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [playing, activeId, list.length, go]);

  // keep the active thumbnail in view (without scrolling the page)
  React.useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.querySelector<HTMLElement>(`[data-id="${activeId}"]`);
    if (strip && el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [activeId]);

  if (!car) {
    return <p className="py-12 text-center font-medium text-white/60">No cars in this category yet — check back soon.</p>;
  }

  const price = car.kmPlans?.[0]?.dailyPrice ?? (car.pricing ? Number(car.pricing.dailyPrice) : 2500);
  const seats = car.seatOption?.count ?? 5;
  const luggage = car.carCapacity?.luggageCapacity || car.carCapacity?.label || (seats >= 7 ? "3-4 Bags" : "2 Bags");
  const stageSrc = failed[car.id] ? getCarFallbackImage(car.brand.name, car.category?.name) : imageOf(car);

  const specs = [
    { icon: Fuel, label: car.fuelType?.name ?? "Diesel" },
    { icon: Cog, label: car.transmissionType?.name ?? "Manual" },
    { icon: Users, label: `${seats} Seats` },
    { icon: Briefcase, label: luggage },
  ];

  return (
    <div
      className="flex w-full flex-col gap-8"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
    >
      {/* ── Category pills ── */}
      <div className="flex flex-wrap gap-2">
        {[{ id: "all", label: "All" }, ...tabs].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`rounded-full px-4 py-2 text-[11px] font-bold tracking-widest uppercase transition-all cursor-pointer ${
              activeTab === t.id
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30"
                : "border border-white/15 bg-white/5 text-white/70 hover:border-amber-400/50 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Spotlight ── */}
      <div className="relative grid items-stretch gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Stage */}
        <div className="relative aspect-[16/11] overflow-hidden rounded-[28px] border border-white/10 bg-neutral-900 shadow-2xl shadow-black/50 sm:aspect-[16/10]">
          <Image
            key={car.id}
            src={stageSrc}
            alt={car.images[0]?.altText ?? car.name}
            fill
            sizes="(max-width: 1024px) 100vw, 780px"
            quality={80}
            priority={index === 0}
            onError={() => setFailed((f) => ({ ...f, [car.id]: true }))}
            className="hero-kenburns animate-in fade-in object-cover duration-700"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-3 left-4 max-w-full truncate text-[5.5rem] leading-none font-black tracking-tighter text-transparent uppercase select-none [-webkit-text-stroke:1px_rgba(255,255,255,0.18)] sm:text-[8rem]"
          >
            {car.brand.name}
          </span>

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-amber-300 uppercase backdrop-blur-md">
              {car.brand.name}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 backdrop-blur-md">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Available
            </span>
          </div>

          <div className="absolute top-4 right-4 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[11px] font-bold text-white/80 tabular-nums backdrop-blur-md">
            {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
          </div>

          {/* arrows */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous car"
            className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:border-amber-400 hover:text-amber-300"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next car"
            className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition hover:border-amber-400 hover:text-amber-300"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Details */}
        <div key={car.id} className="animate-in fade-in slide-in-from-right-4 flex flex-col justify-between gap-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 backdrop-blur-sm duration-500 sm:p-8">
          <div>
            <span className="text-[11px] font-bold tracking-[0.25em] text-amber-300 uppercase">
              {car.category?.name ?? car.brand.name} class
            </span>
            <h3 className="mt-2 text-3xl leading-[1.02] font-black tracking-tight text-white uppercase sm:text-4xl">{car.name}</h3>

            <ul className="mt-5 flex flex-wrap gap-2">
              {specs.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85">
                  <Icon className="size-3.5 text-amber-300" /> {label}
                </li>
              ))}
            </ul>

            {car.features && car.features.length > 0 && (
              <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {car.features.slice(0, 4).map((f) => (
                  <li key={f.feature.id} className="flex items-center gap-2 text-xs font-medium text-white/70">
                    <Check className="size-3.5 shrink-0 text-emerald-400" />
                    <span className="truncate">{f.feature.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-5">
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">{text.startingFromLabel}</div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-4xl font-black tracking-tight text-transparent">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-semibold text-white/55">/ day</span>
                </div>
              </div>
              <Link href={`/car/${car.slug}`} className="text-xs font-bold text-white/70 underline-offset-4 transition hover:text-amber-300 hover:underline">
                Full details →
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
              <Link
                href={`/car/${car.slug}`}
                className="shimmer-sheen relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-500/30 transition active:scale-[0.98]"
              >
                {text.bookLabel} <ArrowRight className="size-4" />
              </Link>
              <CarWhatsAppBook
                car={{ id: car.id, slug: car.slug, name: car.name, priceLabel: `From ₹${price.toLocaleString("en-IN")} / day` }}
                locations={car.locations?.map((l) => ({ id: l.location.id, name: l.location.name })) ?? []}
                label="WhatsApp"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition hover:bg-[#1ebe5a] active:scale-[0.98] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filmstrip (single row) ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause auto-play" : "Play auto-play"}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-300 transition hover:bg-amber-400/20"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>

        <div ref={stripRef} className="flex flex-1 gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollSnapType: "x proximity" }}>
          {list.map((c) => {
            const active = c.id === car.id;
            return (
              <button
                key={c.id}
                type="button"
                data-id={c.id}
                onClick={() => setActiveId(c.id)}
                aria-label={`Show ${c.name}`}
                aria-current={active}
                style={{ scrollSnapAlign: "center" }}
                className={`group relative w-36 shrink-0 overflow-hidden rounded-2xl border text-left transition-all duration-300 sm:w-44 ${
                  active ? "border-amber-400 shadow-lg shadow-orange-500/20" : "border-white/10 opacity-70 hover:border-white/30 hover:opacity-100"
                }`}
              >
                <div className="relative aspect-[4/3] bg-neutral-900">
                  <Image
                    src={failed[c.id] ? getCarFallbackImage(c.brand.name, c.category?.name) : imageOf(c)}
                    onError={() => setFailed((f) => ({ ...f, [c.id]: true }))}
                    alt=""
                    fill
                    sizes="180px"
                    quality={60}
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-x-2 bottom-1.5">
                    <div className="truncate text-[11px] font-black text-white uppercase">{c.name}</div>
                    <div className="text-[10px] font-semibold text-amber-300">
                      ₹{(c.kmPlans?.[0]?.dailyPrice ?? (c.pricing ? Number(c.pricing.dailyPrice) : 2500)).toLocaleString("en-IN")}/day
                    </div>
                  </div>
                </div>
                {/* auto-play progress */}
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10">
                  {active && (
                    <span
                      key={`${c.id}-${playing}`}
                      className="block h-full origin-left bg-gradient-to-r from-amber-300 to-orange-500"
                      style={{ animation: playing ? `fleetProgress ${AUTO_MS}ms linear forwards` : undefined, width: playing ? undefined : "100%" }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Link
        href={viewAllHref}
        className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:border-amber-400/60 hover:bg-white/10 hover:text-amber-300"
      >
        {text.viewAllLabel.replace("{count}", String(totalCount))} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
