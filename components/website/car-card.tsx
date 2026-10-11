"use client";

import * as React from "react";

import { resolveCarKmPlans, type CarKmPlan } from "@/lib/pricing/km-plans";
import { CarWhatsAppBook } from "@/components/website/car-whatsapp-book";
import { getCarFallbackImage } from "@/lib/car-fallback-image";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Briefcase, Check, Cog, Eye, Fuel, Loader2, Sparkles, Star, Users, Zap } from "lucide-react";

// Unsplash fallback images — keyed by brand name (lowercase) or category (lowercase)
export interface CarCardData {
  id: string;
  name: string;
  slug: string;
  year: number;
  isFeatured?: boolean;
  brand: { name: string };
  model: { name: string };
  carType?: { name: string } | null;
  category?: { name: string } | null;
  transmissionType?: { name: string } | null;
  fuelType?: { name: string } | null;
  seatOption?: { count: number; label?: string | null } | null;
  doorOption?: { count: number; label?: string | null } | null;
  cylinderOption?: { count: number; label?: string | null } | null;
  steeringType?: { id: string; name: string } | null;
  carCapacity?: { id: string; label: string; luggageCapacity?: string | null } | null;
  features?: { feature: { id: string; name: string; icon?: string | null } }[];
  safetyFeatures?: { safetyFeature: { id: string; name: string; icon?: string | null } }[];
  images: { url: string; altText?: string | null }[];
  pricing: {
    dailyPrice: string | number;
    hourlyPrice?: string | number | null;
    includedKmPerDay?: number | null;
    extraKmPrice?: string | number | null;
  } | null;
  locations?: { locationId: string; location: { id: string; name: string; slug?: string } }[];
  /** 3 KM plans (admin-set prices, else calculated) — see lib/pricing/km-plans.ts */
  kmPlans?: CarKmPlan[];
}

export interface CarCardProps {
  car: CarCardData;
  variant?: "wide" | "compact";
  showBasePriceOnly?: boolean;
  searchParams?: Record<string, string | undefined>;
}

function parseDurationDays(pickupStr?: string | null, dropStr?: string | null): number {
  if (!pickupStr || !dropStr) return 1;
  try {
    const sNorm = pickupStr.includes("T") && pickupStr.split("T")[1]?.length === 5 ? `${pickupStr}:00` : pickupStr;
    const eNorm = dropStr.includes("T") && dropStr.split("T")[1]?.length === 5 ? `${dropStr}:00` : dropStr;
    const start = new Date(sNorm).getTime();
    const end = new Date(eNorm).getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 1;
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    return Math.max(1, Math.ceil(hours / 24));
  } catch {
    return 1;
  }
}

function CarCardInner({
  car,
  variant = "wide",
  showBasePriceOnly = false,
  searchParams: serverParams,
}: CarCardProps) {
  const clientSearchParams = useSearchParams();
  const locationId =
    serverParams?.locationId ??
    serverParams?.location ??
    clientSearchParams.get("locationId") ??
    clientSearchParams.get("location");
  const pickupDate = serverParams?.pickupDate ?? clientSearchParams.get("pickupDate");
  const dropDate = serverParams?.dropDate ?? clientSearchParams.get("dropDate");

  // Calculate rental duration in days from active trip dates
  const tripDays = React.useMemo(() => {
    if (showBasePriceOnly) return 1;
    return parseDurationDays(pickupDate, dropDate);
  }, [pickupDate, dropDate, showBasePriceOnly]);

  const queryParams = React.useMemo(() => {
    const q = new URLSearchParams();
    if (locationId) q.set("location", locationId);
    if (!showBasePriceOnly && pickupDate) q.set("pickupDate", pickupDate);
    if (!showBasePriceOnly && dropDate) q.set("dropDate", dropDate);
    const qs = q.toString();
    return qs ? `?${qs}` : "";
  }, [locationId, pickupDate, dropDate, showBasePriceOnly]);

  const carHref = `/car/${car.slug}${queryParams}`;
  const image = car.images[0];
  const dailyPrice = car.kmPlans?.[0]?.dailyPrice ?? (car.pricing ? Number(car.pricing.dailyPrice) : 2500);
  const baseKm = car.kmPlans?.[0]?.km ?? Number(car.pricing?.includedKmPerDay ?? 250);
  const extraKmRate = Number(car.pricing?.extraKmPrice ?? 15);

  const categoryName = car.category?.name ?? car.brand.name;
  const fuelName = car.fuelType?.name ?? "Diesel";
  const transmissionName = car.transmissionType?.name ?? "Manual";
  const seatCount = car.seatOption?.count ?? 5;
  const luggage =
    car.carCapacity?.luggageCapacity ||
    car.carCapacity?.label ||
    (seatCount >= 7 ? "3-4 Bags" : "2 Bags");

  const fallbackImg = getCarFallbackImage(car.brand.name, categoryName);
  const [imgSrc, setImgSrc] = React.useState<string>(image?.url || fallbackImg);
  const [bookingKey, setBookingKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    setImgSrc(image?.url || fallbackImg);
  }, [image?.url, fallbackImg]);

  // KM plans — the same numbers the car page and the pricing engine use (admin-set, else calculated)
  const packages = React.useMemo(() => {
    const plans =
      car.kmPlans ??
      resolveCarKmPlans({ id: car.id, dailyPrice, hourlyPrice: null, includedKmPerDay: baseKm, extraKmPrice: extraKmRate });
    return plans.map((plan) => ({
      id: `plan-${plan.plan}`,
      plan: plan.plan,
      kmLimit: plan.km * tripDays,
      price: plan.dailyPrice * tripDays,
      extraKmPrice: extraKmRate,
      isPopular: plan.isPopular,
    }));
  }, [car.kmPlans, car.id, dailyPrice, baseKm, extraKmRate, tripDays]);

  function getBookHref(kmLimit?: number, pkgPrice?: number, plan?: number) {
    const q = new URLSearchParams();
    if (locationId) q.set("location", locationId);
    if (!showBasePriceOnly && pickupDate) q.set("pickupDate", pickupDate);
    if (!showBasePriceOnly && dropDate) q.set("dropDate", dropDate);
    if (plan && plan > 1) q.set("kmPlan", String(plan));
    if (kmLimit) q.set("kmLimit", String(kmLimit));
    if (pkgPrice) q.set("price", String(pkgPrice));
    const qs = q.toString();
    return `/car/${car.slug}${qs ? `?${qs}` : ""}`;
  }

  const rating = dailyPrice >= 8000 ? 5.0 : dailyPrice >= 6000 ? 4.9 : 4.8;
  const ratingCount = dailyPrice >= 8000 ? 39 : dailyPrice >= 6000 ? 48 : 27;

  // ─── Compact / Home-Page 1-Day Base Price Variant ──────────────────────────────
  if (variant === "compact" || showBasePriceOnly) {
    return (
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-4 transition-all duration-300 luxury-card-hover shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/40">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-black tracking-widest text-orange-700 uppercase">
              {car.brand.name}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Verified
            </span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-neutral-900">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
            <span className="text-neutral-500">({ratingCount})</span>
          </span>
        </div>

        {/* Title + Category */}
        <div className="pt-2">
          <Link href={carHref} className="block group-hover:text-orange-600 transition-colors">
            <h3 className="text-base sm:text-lg font-black leading-tight text-neutral-950 uppercase tracking-tight truncate">
              {car.name}
            </h3>
          </Link>
          <p className="mt-0.5 text-[11px] text-neutral-500">Category : {categoryName}</p>
        </div>

        {/* Car Image (Clickable) */}
        <Link href={carHref} className="shimmer-sheen relative my-3 block aspect-[16/10] w-full overflow-hidden rounded-xl bg-gradient-to-b from-neutral-50 to-neutral-100/70 border border-neutral-200/70 shadow-inner">
          <Image
            src={imgSrc}
            alt={image?.altText ?? car.name}
            fill
            sizes="(max-width: 640px) 280px, 340px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            onError={() => setImgSrc(fallbackImg)}
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-neutral-600 px-1">
            {car.isFeatured ? (
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Sparkles className="size-2.5 fill-amber-500 text-amber-500" /> Featured
              </span>
            ) : car.features && car.features.length > 0 && car.features[0]?.feature ? (
              <span className="flex items-center gap-1 text-emerald-700 font-semibold truncate max-w-[120px]">
                <Zap className="size-2.5 fill-emerald-600 text-emerald-600 shrink-0" />
                <span className="truncate">{car.features[0].feature.name}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Zap className="size-2.5 fill-emerald-600 text-emerald-600" /> Instant
              </span>
            )}
            <span className="text-neutral-500">{car.year}</span>
          </div>
        </Link>

        {/* Quick Specs Icons (Includes Dynamic Luggage from Admin) */}
        <div className="flex items-center justify-between gap-1.5 border-t border-neutral-150 py-2.5 text-[10px] sm:text-[11px] text-neutral-600">
          <span className="flex items-center gap-1">
            <Fuel className="size-3 text-orange-500" />
            {fuelName}
          </span>
          <span className="flex items-center gap-1">
            <Cog className="size-3 text-orange-500" />
            {transmissionName}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3 text-orange-500" />
            {seatCount} Seats
          </span>
          <span className="hidden xs:flex items-center gap-1 text-neutral-500">
            <Briefcase className="size-3 text-orange-500/80" />
            {luggage}
          </span>
        </div>

        {/* Footer: 1-Day Base Price + Book CTA */}
        <div className="mt-auto flex items-center justify-between border-t border-neutral-150 pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 font-medium">Base rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-neutral-950">
                ₹{dailyPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-neutral-500">/ day</span>
            </div>
          </div>
          <Link
            href={getBookHref()}
            className="shimmer-sheen flex items-center gap-1 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/25 hover:bg-orange-600 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Book →
          </Link>
        </div>
      </div>
    );
  }

  // ─── Default: Wide Single-Car Card with Dynamic KM Basis Prices (Matches Image 2) ──
  return (
    <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-5 md:p-6 transition-all duration-300 luxury-card-hover gap-6 items-stretch shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/40">
      {/* ── Left Column: Car Image + Badges ── */}
      <div className="shimmer-sheen relative flex flex-col justify-between w-full md:w-[260px] lg:w-[280px] shrink-0 rounded-xl bg-gradient-to-b from-neutral-50 to-neutral-100/70 border border-neutral-200/70 p-3 overflow-hidden shadow-inner">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5 w-full z-10">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-[10px] font-black tracking-widest text-orange-700 uppercase">
              {car.brand.name}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Verified
            </span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-neutral-900">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
            <span className="text-neutral-500">({ratingCount})</span>
          </span>
        </div>

        {/* Car Image (Clickable) */}
        <Link href={carHref} className="relative my-3 block aspect-[4/3] w-full overflow-hidden rounded-xl">
          <Image
            src={imgSrc}
            alt={image?.altText ?? car.name}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            onError={() => setImgSrc(fallbackImg)}
          />
        </Link>

        {/* Bottom Feature Pill */}
        <div className="flex items-center justify-between text-[11px] text-neutral-600 pt-1 border-t border-neutral-200/60">
          {car.isFeatured ? (
            <span className="flex items-center gap-1 text-amber-600 font-bold">
              <Sparkles className="size-3 fill-amber-500 text-amber-500" /> Featured Fleet
            </span>
          ) : car.features && car.features.length > 0 && car.features[0]?.feature ? (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold truncate max-w-[160px]">
              <Zap className="size-3 fill-emerald-600 text-emerald-600 shrink-0" />
              <span className="truncate">{car.features[0].feature.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Zap className="size-3 fill-emerald-600 text-emerald-600" /> Instant Delivery
            </span>
          )}
          <span className="text-neutral-500">{car.year}</span>
        </div>
      </div>

      {/* ── Right Column: Car Details + 3 KM-Basis Price Boxes ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
        {/* Header: Title + Category + Specs */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-neutral-950 tracking-tight uppercase group-hover:text-orange-600 transition-colors">
                {car.name}
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500 font-medium flex flex-wrap items-center gap-1.5">
                <span>Category : <span className="text-neutral-900 font-bold">{categoryName}</span></span>
                {car.locations && car.locations.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-orange-700 font-semibold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
                    📍 {car.locations.map((l) => l.location.name).join(", ")}
                  </span>
                )}
              </p>
            </div>

            <Link
              href={carHref}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 hover:border-neutral-300 transition shadow-xs"
            >
              <Eye className="size-3.5 text-orange-500" /> Specs
            </Link>
          </div>

          {/* Quick Specs Row with Icons (Matches Image 2) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 pt-3 border-t border-neutral-150 text-xs text-neutral-700 font-medium">
            <span className="flex items-center gap-1.5">
              <Fuel className="size-3.5 text-orange-500" />
              {fuelName}
            </span>
            <span className="flex items-center gap-1.5">
              <Cog className="size-3.5 text-orange-500" />
              {transmissionName}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 text-orange-500" />
              {seatCount} Persons
            </span>
            <span className="flex items-center gap-1.5 text-neutral-600">
              <Briefcase className="size-3.5 text-orange-500" />
              {luggage}
            </span>
            {tripDays > 1 && (
              <span className="ml-auto text-[11px] font-semibold text-orange-700 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                {tripDays} Days Trip Pricing
              </span>
            )}
          </div>

          {/* Admin-Configured Dynamic Features Tags */}
          {car.features && car.features.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {car.features.slice(0, 4).map((f) => (
                <span
                  key={f.feature.id}
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-700"
                >
                  <Check className="size-2.5 text-emerald-600" />
                  {f.feature.name}
                </span>
              ))}
              {car.features.length > 4 && (
                <span className="text-[10px] text-neutral-400 font-medium self-center">
                  +{car.features.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── 3 Dynamic KM-Basis Packages (Matches Image 2) ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5 pt-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-xl sm:rounded-2xl p-2 pt-3.5 sm:p-4 text-center flex flex-col items-center justify-between gap-1 sm:gap-2 transition-all relative ${
                pkg.isPopular
                  ? "border-2 border-orange-500 bg-gradient-to-b from-orange-500/[0.08] to-orange-500/[0.02] shadow-lg shadow-orange-500/15"
                  : "border border-neutral-200 bg-neutral-50/70 hover:border-orange-500/40 hover:bg-orange-50/20"
              }`}
            >
              {pkg.isPopular && (
                <span className="shimmer-sheen absolute -top-2.5 bg-orange-500 text-white text-[8px] sm:text-[9px] font-black uppercase px-2 sm:px-2.5 py-0.5 rounded-full tracking-wider shadow-md shadow-orange-500/30 whitespace-nowrap">
                  <span className="sm:hidden">Popular</span><span className="hidden sm:inline">Recommended</span>
                </span>
              )}

              {/* Price */}
              <div className="text-[15px] leading-tight sm:text-2xl md:text-[26px] font-black text-neutral-950 tracking-tight">
                ₹{pkg.price.toLocaleString("en-IN")}
              </div>

              {/* KM Limit */}
              <div className="text-[11px] sm:text-xs font-bold text-neutral-800 leading-tight">
                {pkg.kmLimit} KM<span className="hidden sm:inline"> Driving Limit</span>
              </div>

              {/* Extra KM Charge */}
              <div className="text-[9px] sm:text-[11px] leading-tight text-neutral-500">
                <span className="sm:hidden">+₹{pkg.extraKmPrice}/extra km</span><span className="hidden sm:inline">(Extra KM charge ₹{pkg.extraKmPrice})</span>
              </div>

              {/* Book Now Button */}
              <Link
                href={getBookHref(pkg.kmLimit, pkg.price, pkg.plan)}
                onClick={() => setBookingKey(`${pkg.kmLimit}-${pkg.price}`)}
                aria-busy={bookingKey === `${pkg.kmLimit}-${pkg.price}`}
                className="shimmer-sheen w-full mt-1 flex items-center justify-center gap-1 rounded-lg sm:rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] sm:text-xs font-bold py-2 sm:py-2.5 px-1.5 sm:px-3 shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                {bookingKey === `${pkg.kmLimit}-${pkg.price}` ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> <span className="hidden sm:inline">Booking...</span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Book</span>
                    <span className="hidden sm:inline">Book Now</span>
                  </>
                )}
              </Link>
            </div>
          ))}
        </div>

        {/* WhatsApp booking: collects details, saves an enquiry, then opens the chat */}
        <CarWhatsAppBook
          car={{
            id: car.id,
            slug: car.slug,
            name: car.name,
            priceLabel: `From ₹${Math.round(dailyPrice).toLocaleString("en-IN")} / day`,
          }}
          pickupDate={pickupDate ?? undefined}
          dropDate={dropDate ?? undefined}
          locations={car.locations?.map((l) => ({ id: l.location.id, name: l.location.name, slug: l.location.slug })) ?? []}
          defaultLocationId={locationId}
          label="Book on WhatsApp"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-xs font-black text-white shadow-md shadow-emerald-500/25 transition hover:bg-[#1ebe5a] active:scale-[0.99] cursor-pointer"
        />
      </div>
    </div>
  );
}

export function CarCard(props: CarCardProps) {
  return (
    <React.Suspense fallback={null}>
      <CarCardInner {...props} />
    </React.Suspense>
  );
}
