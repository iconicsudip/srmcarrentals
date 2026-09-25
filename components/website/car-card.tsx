"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  CarFront,
  Check,
  Cog,
  Eye,
  Flame,
  Fuel,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

// Unsplash fallback images — keyed by brand name (lowercase) or category (lowercase)
const BRAND_FALLBACK_IMAGES: Record<string, string> = {
  "maruti suzuki":
    "https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?w=800&q=80&auto=format&fit=crop",
  maruti:
    "https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?w=800&q=80&auto=format&fit=crop",
  hyundai:
    "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80&auto=format&fit=crop",
  toyota:
    "https://srm-rentals-uploads.s3.ap-south-1.amazonaws.com/cars/toyota-rumion-Toyota-Rumion-SRM-Car-Rentals-1.png",
  kia:
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80&auto=format&fit=crop",
  mahindra:
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80&auto=format&fit=crop",
  tata:
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80&auto=format&fit=crop",
  honda:
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&auto=format&fit=crop",
  renault:
    "https://images.unsplash.com/photo-1581650107963-3b032af8a517?w=800&q=80&auto=format&fit=crop",
  ford:
    "https://images.unsplash.com/photo-1551830820-c6b3bdc0cfcb?w=800&q=80&auto=format&fit=crop",
  volkswagen:
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80&auto=format&fit=crop",
  skoda:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
  default:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&auto=format&fit=crop",
};

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  hatchback:
    "https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?w=800&q=80&auto=format&fit=crop",
  sedan:
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&auto=format&fit=crop",
  suv:
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop",
  "compact suv":
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80&auto=format&fit=crop",
  mpv:
    "https://images.unsplash.com/photo-1621993202328-de4e0c26c3de?w=800&q=80&auto=format&fit=crop",
  luxury:
    "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80&auto=format&fit=crop",
};

function getCarFallbackImage(brandName: string, categoryName?: string | null): string {
  const brand = brandName.toLowerCase();
  for (const [k, url] of Object.entries(BRAND_FALLBACK_IMAGES)) {
    if (brand.includes(k)) return url;
  }
  if (categoryName) {
    const cat = categoryName.toLowerCase();
    for (const [k, url] of Object.entries(BRAND_FALLBACK_IMAGES)) {
      if (cat.includes(k)) return url;
    }
  }
  return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80&auto=format&fit=crop";
}

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
    if (locationId) q.set("locationId", locationId);
    if (!showBasePriceOnly && pickupDate) q.set("pickupDate", pickupDate);
    if (!showBasePriceOnly && dropDate) q.set("dropDate", dropDate);
    const qs = q.toString();
    return qs ? `?${qs}` : "";
  }, [locationId, pickupDate, dropDate, showBasePriceOnly]);

  const carHref = `/car/${car.slug}${queryParams}`;
  const image = car.images[0];
  const dailyPrice = car.pricing ? Number(car.pricing.dailyPrice) : 2500;
  const baseKm = Number(car.pricing?.includedKmPerDay ?? 250);
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

  React.useEffect(() => {
    setImgSrc(image?.url || fallbackImg);
  }, [image?.url, fallbackImg]);

  // 3 Dynamic KM-basis packages matching Image 2
  const packages = React.useMemo(() => {
    // Tier 1: ~66% of standard base KM (e.g. 165 KM for 250 base * days)
    const km1 = Math.round(Math.max(100, baseKm * 0.66) * tripDays);
    const price1 = Math.round(dailyPrice * tripDays * 0.90);

    // Tier 2: ~132% of standard base KM (e.g. 330 KM for 250 base * days) - Most Popular
    const km2 = Math.round(Math.max(200, baseKm * 1.32) * tripDays);
    const price2 = Math.round(dailyPrice * tripDays * 1.04);

    // Tier 3: ~193% of standard base KM (e.g. 482 KM for 250 base * days)
    const km3 = Math.round(Math.max(300, baseKm * 1.93) * tripDays);
    const price3 = Math.round(dailyPrice * tripDays * 1.18);

    return [
      {
        id: "economy",
        kmLimit: km1,
        price: price1,
        extraKmPrice: extraKmRate,
        isPopular: false,
      },
      {
        id: "popular",
        kmLimit: km2,
        price: price2,
        extraKmPrice: extraKmRate,
        isPopular: true,
      },
      {
        id: "extended",
        kmLimit: km3,
        price: price3,
        extraKmPrice: extraKmRate,
        isPopular: false,
      },
    ];
  }, [dailyPrice, baseKm, extraKmRate, tripDays]);

  function getBookHref(kmLimit?: number, pkgPrice?: number) {
    const q = new URLSearchParams();
    if (locationId) q.set("locationId", locationId);
    if (!showBasePriceOnly && pickupDate) q.set("pickupDate", pickupDate);
    if (!showBasePriceOnly && dropDate) q.set("dropDate", dropDate);
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
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90 p-4 transition-all duration-300 luxury-card-hover backdrop-blur-sm">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-orange-500/15 border border-orange-500/20 px-2 py-0.5 text-[10px] font-black tracking-widest text-orange-400 uppercase">
              {car.brand.name}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Verified
            </span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-white">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
            <span className="text-white/35">({ratingCount})</span>
          </span>
        </div>

        {/* Title + Category */}
        <div className="pt-2">
          <Link href={carHref} className="block group-hover:text-orange-400 transition-colors">
            <h3 className="text-base sm:text-lg font-black leading-tight text-white uppercase tracking-tight truncate">
              {car.name}
            </h3>
          </Link>
          <p className="mt-0.5 text-[11px] text-white/40">Category : {categoryName}</p>
        </div>

        {/* Car Image (Clickable) */}
        <Link href={carHref} className="shimmer-sheen relative my-3 block aspect-[16/10] w-full overflow-hidden rounded-xl bg-black/50 border border-white/5 shadow-inner">
          <Image
            src={imgSrc}
            alt={image?.altText ?? car.name}
            fill
            sizes="(max-width: 640px) 280px, 340px"
            className="object-contain p-2 transition-transform duration-700 ease-out group-hover:scale-108"
            onError={() => setImgSrc(fallbackImg)}
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/50 px-1">
            {car.isFeatured ? (
              <span className="flex items-center gap-1 text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                <Sparkles className="size-2.5 fill-amber-400" /> Featured
              </span>
            ) : car.features && car.features.length > 0 && car.features[0]?.feature ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold truncate max-w-[120px]">
                <Zap className="size-2.5 fill-emerald-400 shrink-0" />
                <span className="truncate">{car.features[0].feature.name}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Zap className="size-2.5 fill-emerald-400" /> Instant
              </span>
            )}
            <span className="text-white/40">{car.year}</span>
          </div>
        </Link>

        {/* Quick Specs Icons (Includes Dynamic Luggage from Admin) */}
        <div className="flex items-center justify-between gap-1.5 border-t border-white/5 py-2.5 text-[10px] sm:text-[11px] text-white/60">
          <span className="flex items-center gap-1">
            <Fuel className="size-3 text-orange-400" />
            {fuelName}
          </span>
          <span className="flex items-center gap-1">
            <Cog className="size-3 text-orange-400" />
            {transmissionName}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3 text-orange-400" />
            {seatCount} Seats
          </span>
          <span className="hidden xs:flex items-center gap-1 text-white/45">
            <Briefcase className="size-3 text-orange-400/80" />
            {luggage}
          </span>
        </div>

        {/* Footer: 1-Day Base Price + Book CTA */}
        <div className="mt-auto flex items-center justify-between border-t border-white/8 pt-3">
          <div className="flex flex-col">
            <span className="text-xs text-white/40 font-medium">Base rate</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white">
                ₹{dailyPrice.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-white/45">/ day</span>
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
    <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90 p-5 md:p-6 backdrop-blur transition-all duration-300 luxury-card-hover gap-6 items-stretch">
      {/* ── Left Column: Car Image + Badges ── */}
      <div className="shimmer-sheen relative flex flex-col justify-between w-full md:w-[260px] lg:w-[280px] shrink-0 rounded-xl bg-black/50 border border-white/5 p-3 overflow-hidden shadow-inner">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5 w-full z-10">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-orange-500/15 border border-orange-500/20 px-2 py-0.5 text-[10px] font-black tracking-widest text-orange-400 uppercase">
              {car.brand.name}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Verified
            </span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-white">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
            <span className="text-white/35">({ratingCount})</span>
          </span>
        </div>

        {/* Car Image (Clickable) */}
        <Link href={carHref} className="relative my-3 block aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imgSrc}
            alt={image?.altText ?? car.name}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-108"
            onError={() => setImgSrc(fallbackImg)}
          />
        </Link>

        {/* Bottom Feature Pill */}
        <div className="flex items-center justify-between text-[11px] text-white/50 pt-1 border-t border-white/5">
          {car.isFeatured ? (
            <span className="flex items-center gap-1 text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
              <Sparkles className="size-3 fill-amber-400 text-amber-400" /> Featured Fleet
            </span>
          ) : car.features && car.features.length > 0 && car.features[0]?.feature ? (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold truncate max-w-[160px]">
              <Zap className="size-3 fill-emerald-400 shrink-0" />
              <span className="truncate">{car.features[0].feature.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Zap className="size-3 fill-emerald-400" /> Instant Delivery
            </span>
          )}
          <span className="text-white/30">{car.year}</span>
        </div>
      </div>

      {/* ── Right Column: Car Details + 3 KM-Basis Price Boxes ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
        {/* Header: Title + Category + Specs */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase group-hover:text-orange-400 transition-colors">
                {car.name}
              </h3>
              <p className="mt-0.5 text-xs text-white/50 font-medium">
                Category : <span className="text-white/80 font-bold">{categoryName}</span>
              </p>
            </div>

            <Link
              href={carHref}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white hover:border-white/25 transition"
            >
              <Eye className="size-3.5 text-orange-400" /> Specs
            </Link>
          </div>

          {/* Quick Specs Row with Icons (Matches Image 2) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 pt-3 border-t border-white/8 text-xs text-white/70 font-medium">
            <span className="flex items-center gap-1.5">
              <Fuel className="size-3.5 text-orange-400" />
              {fuelName}
            </span>
            <span className="flex items-center gap-1.5">
              <Cog className="size-3.5 text-orange-400" />
              {transmissionName}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 text-orange-400" />
              {seatCount} Persons
            </span>
            <span className="flex items-center gap-1.5 text-white/60">
              <Briefcase className="size-3.5 text-orange-400" />
              {luggage}
            </span>
            {tripDays > 1 && (
              <span className="ml-auto text-[11px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
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
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/75"
                >
                  <Check className="size-2.5 text-emerald-400" />
                  {f.feature.name}
                </span>
              ))}
              {car.features.length > 4 && (
                <span className="text-[10px] text-white/40 font-medium self-center">
                  +{car.features.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── 3 Dynamic KM-Basis Packages (Matches Image 2) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl p-4 text-center flex flex-col items-center justify-between gap-2 transition-all relative ${
                pkg.isPopular
                  ? "border-2 border-orange-500/70 bg-gradient-to-b from-orange-500/[0.14] to-orange-500/[0.04] shadow-lg shadow-orange-500/15"
                  : "border border-white/10 bg-black/40 hover:border-white/20 hover:bg-black/60"
              }`}
            >
              {pkg.isPopular && (
                <span className="shimmer-sheen absolute -top-2.5 bg-orange-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-md shadow-orange-500/30">
                  Recommended
                </span>
              )}

              {/* Price */}
              <div className="text-2xl md:text-[26px] font-black text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.15)]">
                ₹{pkg.price.toLocaleString("en-IN")}
              </div>

              {/* KM Limit */}
              <div className="text-xs font-bold text-white leading-tight">
                {pkg.kmLimit} KM Driving Limit
              </div>

              {/* Extra KM Charge */}
              <div className="text-[11px] text-white/45">
                (Extra KM charge ₹{pkg.extraKmPrice})
              </div>

              {/* Book Now Button */}
              <Link
                href={getBookHref(pkg.kmLimit, pkg.price)}
                className="shimmer-sheen w-full mt-1 flex items-center justify-center gap-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2.5 px-3 shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Book Now
              </Link>
            </div>
          ))}
        </div>
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
