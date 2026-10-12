"use client";

import { useCopy } from "@/components/copy-provider";
import { ADVANCE_PERCENT, splitAdvance } from "@/lib/checkout/advance";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, MapPin, MessageCircle, Plane, Phone, ShieldCheck, ShoppingBag, Tag } from "lucide-react";
import { toast } from "sonner";
import { clampPlan, type CarKmPlan } from "@/lib/pricing/km-plans";
import { pickWhatsAppNumber, toWaNumber, type WhatsAppNumbers } from "@/lib/whatsapp/pick";
import type { PricingCalculateResponse } from "@srm/types";

import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { addToCart } from "@/lib/cart/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { TripSchedulePicker } from "@/components/website/datetime-picker";

export interface BookingEngineProps {
  carId: string;
  carSlug?: string;
  carName: string;
  carImage?: string;
  dailyPrice: number;
  hourlyPrice?: number | null;
  fuelType?: string;
  includedKmPerDay: number;
  extraKmPrice?: number;
  /** The 3 KM plans for this car (admin-set prices, else calculated). */
  kmPlans: CarKmPlan[];
  /** Plans for pickup locations with their own prices (locationId → plans). */
  kmPlansByLocation?: Record<string, CarKmPlan[]>;
  phone: string;
  /** City-wise WhatsApp routing (from admin settings). */
  whatsappNumbers?: WhatsAppNumbers | null;
  /** From Admin → Settings → Payments. */
  advancePercent?: number;
  securityDeposit?: number;
  locations: { id: string; slug?: string; name: string; city: string; state: string; dropCharge?: any }[];
  airports: { id: string; name: string; code: string; city: string }[];
  insurances: { id: string; name: string; dailyPrice?: any; fixedPrice?: any; description?: string | null }[];
  extraServices: { id: string; name: string; price: any; pricingType: string; description?: string | null }[];
}

function formatInr(amount: number | string | null | undefined) {
  if (amount == null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/** Current local datetime snapped to next 15-min boundary as "YYYY-MM-DDTHH:mm" */
function nowMinDateTime(): string {
  const d = new Date();
  const snappedMins = Math.ceil(d.getMinutes() / 15) * 15;
  if (snappedMins >= 60) {
    d.setHours(d.getHours() + 1, 0, 0, 0);
  } else {
    d.setMinutes(snappedMins, 0, 0);
  }
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/** Add hours to a "YYYY-MM-DDTHH:mm" string and return the same format */
function addHoursToISO(iso: string, hours: number): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  d.setTime(d.getTime() + hours * 3_600_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/** Add days to a "YYYY-MM-DD" string */
function calculateDurationText(pickup: string, drop: string): { text: string; hours: number; days: number } {
  const start = new Date(pickup).getTime();
  const end = new Date(drop).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) {
    return { text: "Select dates", hours: 0, days: 0 };
  }
  const totalHours = Math.ceil((end - start) / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;

  if (days === 0) {
    return { text: `${totalHours} hour${totalHours > 1 ? "s" : ""}`, hours: totalHours, days: 0 };
  }
  if (remHours === 0) {
    return { text: `${days} day${days > 1 ? "s" : ""}`, hours: totalHours, days };
  }
  return { text: `${days}d ${remHours}h (${totalHours} hrs)`, hours: totalHours, days };
}

export function BookingEngine({
  carId,
  carSlug,
  carName,
  carImage,
  dailyPrice: baseDailyPrice,
  hourlyPrice: baseHourlyPrice,
  fuelType,
  includedKmPerDay,
  extraKmPrice = 10,
  kmPlans: baseKmPlans,
  kmPlansByLocation,
  phone,
  whatsappNumbers,
  advancePercent = ADVANCE_PERCENT,
  securityDeposit = 3000,
  locations,
  airports,
  insurances,
  extraServices,
}: BookingEngineProps) {
  const t = useCopy();
  const searchParams = useSearchParams();

  const qLocationRef = searchParams.get("location") ?? searchParams.get("locationId");
  // The URL carries the location's slug (legacy links may carry its id)
  const qLocationId = locations.find((l) => l.id === qLocationRef || l.slug === qLocationRef)?.id ?? null;
  const qPickup = searchParams.get("pickupDate");
  const qDrop = searchParams.get("dropDate");

  // Mode: "DAILY" or "HOURLY"
  const [rentalMode, setRentalMode] = React.useState<"DAILY" | "HOURLY">("DAILY");

  // Schedule dates
  const [pickup, setPickupRaw] = React.useState(() => {
    if (qPickup) {
      try {
        const d = new Date(qPickup);
        if (!isNaN(d.getTime())) {
          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
      } catch {}
      if (qPickup.includes("T")) return qPickup.slice(0, 16);
    }
    return addHoursToISO(nowMinDateTime(), 24); // default: 24h from now
  });

  const [drop, setDropRaw] = React.useState(() => {
    if (qDrop) {
      try {
        const d = new Date(qDrop);
        if (!isNaN(d.getTime())) {
          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
      } catch {}
      if (qDrop.includes("T")) return qDrop.slice(0, 16);
    }
    return addHoursToISO(nowMinDateTime(), rentalMode === "HOURLY" ? 32 : 48);
  });

  // Derived constraints
  const nowMin = nowMinDateTime();

  // Locations
  const [deliveryType, setDeliveryType] = React.useState<"BRANCH" | "AIRPORT" | "DOORSTEP">("BRANCH");
  const [selectedLocationId, setSelectedLocationId] = React.useState<string>(() => {
    if (qLocationId && locations.some((l) => l.id === qLocationId)) {
      return qLocationId;
    }
    return locations[0]?.id ?? "";
  });
  const [differentDropLocation, setDifferentDropLocation] = React.useState(false);
  const [selectedDropLocationId, setSelectedDropLocationId] = React.useState<string>(() => {
    return locations[0]?.id ?? "";
  });
  const effectiveDropLocationId = differentDropLocation ? selectedDropLocationId : selectedLocationId;
  const [selectedAirportId, setSelectedAirportId] = React.useState<string>(airports[0]?.id ?? "");

  // KM plan (e.g. 120 / 240 / 350 km per 24h): each plan has its own daily and hourly price, set in admin
  const [kmPlan, setKmPlan] = React.useState<1 | 2 | 3>(() => clampPlan(Number(searchParams.get("kmPlan")) || 1));
  // Same car, different price per pickup location
  const kmPlans = (deliveryType === "BRANCH" && kmPlansByLocation?.[selectedLocationId]) || baseKmPlans;
  const activePlan = kmPlans.find((p) => p.plan === kmPlan) ?? kmPlans[0];
  const dailyPrice = activePlan?.dailyPrice ?? baseDailyPrice;
  const hourlyPrice = activePlan?.hourlyPrice ?? baseHourlyPrice;

  // Add-ons & Protection
  const [selectedInsuranceId, setSelectedInsuranceId] = React.useState<string | undefined>(
    insurances.find((i) => Number(i.dailyPrice ?? i.fixedPrice) > 0)?.id,
  );
  const [selectedExtraIds, setSelectedExtraIds] = React.useState<string[]>([]);

  // Coupon
  const [couponInput, setCouponInput] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | undefined>(undefined);
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);

  // Availability check state
  const [availLoading, setAvailLoading] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState<boolean | null>(null);

  // Pricing calculation state
  const [calcLoading, setCalcLoading] = React.useState(false);
  const [pricingResult, setPricingResult] = React.useState<PricingCalculateResponse | null>(null);
  // Selected trip split (from the pricing engine) — drives the plan tiles so they follow the chosen dates
  const tripDays = Math.max(pricingResult?.duration?.fullDays ?? 1, 1);
  const tripExtraHours = pricingResult?.duration?.extraHours ?? 0;
  const fallbackExtraHourPrice = pricingResult?.rental?.extraHourPrice ?? 0;
  const tripLabel = `${tripDays} ${tripDays === 1 ? "day" : "days"}${tripExtraHours > 0 ? ` + ${tripExtraHours} hr${tripExtraHours === 1 ? "" : "s"}` : ""}`;
  const [calcError, setCalcError] = React.useState<string | null>(null);

  const duration = calculateDurationText(pickup, drop);

  // Real-time availability check — fires whenever carId / dates change
  React.useEffect(() => {
    if (!pickup || !drop || new Date(drop) <= new Date(pickup)) {
      setIsAvailable(null);
      return;
    }
    let cancelled = false;
    setAvailLoading(true);
    setIsAvailable(null);
    const params = new URLSearchParams({
      carId,
      pickupDateTime: new Date(pickup).toISOString(),
      dropDateTime: new Date(drop).toISOString(),
    });
    fetch(`/api/v1/bookings/availability?${params}`)
      .then((r) => r.json())
      .then((data: { available: boolean }) => {
        if (!cancelled) setIsAvailable(data.available ?? false);
      })
      .catch(() => {
        if (!cancelled) setIsAvailable(null);
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [carId, pickup, drop]);

  // Whenever rental mode changes, adjust default drop date
  const handleModeToggle = (mode: "DAILY" | "HOURLY") => {
    setRentalMode(mode);
    if (mode === "HOURLY") {
      setDropRaw(addHoursToISO(pickup, 8)); // 8 hours from pickup
    } else {
      setDropRaw(addHoursToISO(pickup, 24)); // 24 hours from pickup
    }
  };

  // Calculate pricing whenever core options change
  const fetchPricing = React.useCallback(async () => {
    if (!pickup || !drop || new Date(drop) <= new Date(pickup)) {
      return;
    }
    setCalcLoading(true);
    setCalcError(null);
    try {
      const response = await apiFetch<PricingCalculateResponse>("/pricing/calculate", {
        method: "POST",
        body: {
          carId,
          pickupDateTime: new Date(pickup).toISOString(),
          dropDateTime: new Date(drop).toISOString(),
          pickupLocationId: deliveryType === "BRANCH" ? selectedLocationId : undefined,
          dropLocationId: deliveryType === "BRANCH" ? effectiveDropLocationId : undefined,
          pickupIsAirport: deliveryType === "AIRPORT",
          dropIsAirport: deliveryType === "AIRPORT",
          pickupAirportId: deliveryType === "AIRPORT" ? selectedAirportId : undefined,
          dropAirportId: deliveryType === "AIRPORT" ? selectedAirportId : undefined,
          kmPlan,
          insuranceId: selectedInsuranceId,
          extraServiceIds: selectedExtraIds,
          couponCode: appliedCoupon,
        },
        skipAuthRedirect: true,
      });
      setPricingResult(response);
    } catch (err) {
      setCalcError(err instanceof ApiRequestError ? err.message : t("booking.calc-error"));
    } finally {
      setCalcLoading(false);
    }
  }, [
    carId,
    pickup,
    drop,
    deliveryType,
    selectedLocationId,
    effectiveDropLocationId,
    selectedAirportId,
    kmPlan,
    selectedInsuranceId,
    selectedExtraIds,
    appliedCoupon,
  ]);

  React.useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  // Handle coupon apply
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    setAppliedCoupon(couponInput.trim().toUpperCase());
    toast.success(`Checking coupon ${couponInput.trim().toUpperCase()}...`);
    setTimeout(() => setIsApplyingCoupon(false), 800);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(undefined);
    setCouponInput("");
  };

  const toggleExtra = (id: string) => {
    setSelectedExtraIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Add configuration directly to Cart
  const getLocationLabel = () => {
    const selectedBranch = locations.find((l) => l.id === selectedLocationId);
    const dropBranch = locations.find((l) => l.id === effectiveDropLocationId);
    const selectedAirport = airports.find((a) => a.id === selectedAirportId);
    if (deliveryType === "BRANCH") {
      if (differentDropLocation && dropBranch && dropBranch.id !== selectedBranch?.id) {
        return `${selectedBranch?.name ?? "Branch"} → ${dropBranch.name}`;
      }
      return selectedBranch ? `${selectedBranch.name} (${selectedBranch.city})` : "City Branch";
    }
    return selectedAirport ? `${selectedAirport.name} (${selectedAirport.code})` : "Airport Terminal";
  };

  const handleWhatsAppBook = () => {
    if (isAvailable === false) {
      toast.error("This car is unavailable for the selected dates. Please adjust your dates.");
      return;
    }
    // Route to the selected city's WhatsApp number (falls back to the default / company number).
    const bookingCity = locations.find((l) => l.id === selectedLocationId)?.city;
    const number = pickWhatsAppNumber(whatsappNumbers, bookingCity) || toWaNumber(phone);
    if (!number) {
      toast.error("WhatsApp number is not configured.");
      return;
    }

    const unitPrice = rentalMode === "HOURLY" ? Number(hourlyPrice || 500) : dailyPrice;
    const total = Number.isFinite(pricingResult?.total) ? (pricingResult!.total as number) : unitPrice;
    const insurance = insurances.find((i) => i.id === selectedInsuranceId);
    const extras = extraServices.filter((e) => selectedExtraIds.includes(e.id));
    const when = (iso: string) =>
      new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    const lines = [
      "Hello SRM Car Rentals! 👋",
      "",
      "I'd like to book this car:",
      "",
      `• *Car*: ${carName}`,
      `• *Pickup*: ${when(pickup)}`,
      `• *Drop*: ${when(drop)}`,
      `• *Duration*: ${duration.text}`,
      `• *Handover*: ${getLocationLabel()}`,
      insurance ? `• *Protection*: ${insurance.name}` : null,
      extras.length > 0 ? `• *Add-ons*: ${extras.map((e) => e.name).join(", ")}` : null,
      appliedCoupon ? `• *Coupon*: ${appliedCoupon}` : null,
      `• *Estimated Total*: ${formatInr(total)}`,
      "",
      `Link: ${typeof window !== "undefined" ? window.location.href : ""}`,
      "",
      "Please confirm availability!",
    ].filter((l): l is string => l !== null);

    window.open(`https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  };

  const handleAddToCart = () => {
    if (isAdding) return;
    if (!pickup || !drop || new Date(drop) <= new Date(pickup)) {
      toast.error("Please select valid pickup and drop dates.");
      return;
    }
    if (isAvailable === false) {
      toast.error("This car is unavailable for the selected dates. Please adjust your dates.");
      return;
    }

    const selectedBranch = locations.find((l) => l.id === selectedLocationId);
    const dropBranch = locations.find((l) => l.id === effectiveDropLocationId);
    const selectedAirport = airports.find((a) => a.id === selectedAirportId);
    const selectedInsurance = insurances.find((i) => i.id === selectedInsuranceId);
    const chosenExtras = extraServices.filter((e) => selectedExtraIds.includes(e.id));

    const unitPrice = rentalMode === "HOURLY" ? Number(hourlyPrice || 500) : dailyPrice;
    const rawTotal = pricingResult?.total;
    const finalTotal = Number.isFinite(rawTotal) ? (rawTotal as number) : unitPrice;

    const locDisplayName = getLocationLabel();

    addToCart({
      carId,
      carSlug,
      carName,
      carImage,
      rentalMode,
      dailyPrice,
      hourlyPrice: hourlyPrice ?? null,
      pickup,
      drop,
      durationText: duration.text,
      durationHours: duration.hours,
      durationDays: duration.days,
      fullDays: pricingResult?.duration?.fullDays,
      extraHours: pricingResult?.duration?.extraHours ?? 0,
      extraHourPrice: pricingResult?.rental?.extraHourPrice,
      extraHourCharge: pricingResult?.rental?.extraHourCharge ?? 0,
      deliveryType,
      locationName: locDisplayName,
      pickupLocationId: deliveryType === "BRANCH" ? selectedLocationId : undefined,
      dropLocationId: deliveryType === "BRANCH" ? effectiveDropLocationId : undefined,
      locationDropCharge: pricingResult?.locationDropCharge ?? 0,
      pickupAirportId: deliveryType === "AIRPORT" ? selectedAirportId : undefined,
      dropAirportId: deliveryType === "AIRPORT" ? selectedAirportId : undefined,
      insurance: selectedInsurance
        ? {
            id: selectedInsurance.id,
            name: selectedInsurance.name,
            price: Number(selectedInsurance.dailyPrice ?? selectedInsurance.fixedPrice ?? 0),
          }
        : null,
      extraServices: chosenExtras.map((e) => ({
        id: e.id,
        name: e.name,
        price: Number(e.price ?? 0),
      })),
      couponCode: appliedCoupon,
      discount: pricingResult?.discount ?? 0,
      basePrice:
        pricingResult?.rental?.basePrice ??
        (rentalMode === "HOURLY" ? Number(hourlyPrice || 500) : dailyPrice),
      tax: pricingResult?.totalTax ?? 0,
      total: finalTotal,
      fuelType: fuelType || "Diesel",
      includedKm: pricingResult?.rental?.includedKm ?? (duration.days || 1) * (activePlan?.km ?? includedKmPerDay),
      kmPlan,
      extraKmPrice: pricingResult?.rental?.extraKmPrice ?? 10,
      securityDeposit,
      city: selectedBranch?.city ?? "Udaipur",
    });

    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 700);
    toast.success(`${carName} added to your cart!`);
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-neutral-200/90 bg-white p-6 pt-0 shadow-2xl shadow-neutral-900/10 ring-1 ring-neutral-900/5">
      {/* Header — dark "key card" band */}
      <div className="relative -mx-6 overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 px-6 py-5 text-white">
        <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.45),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        <div className="relative flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-amber-400 uppercase">
              <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              {t("booking.reserve-your-drive")}
            </span>
            <h3 className="mt-1 truncate text-xl font-black tracking-tight">{carName}</h3>
          </div>
          <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2 text-right backdrop-blur-md">
            <div className="text-lg leading-none font-black text-amber-300">
              {`₹${Number(dailyPrice).toLocaleString("en-IN")}/day`}
            </div>
            <span className="text-[10px] text-white/60">{rentalMode === "HOURLY" ? "Flexible Hours" : "24-Hour Block"}</span>
          </div>
        </div>
      </div>

      {/* KM plan — per 24 hours */}
      {kmPlans.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-neutral-700">{t("booking.km-plan")}</Label>
            <span className="text-[11px] text-neutral-500">{t("booking.km-extra-rate", { rate: formatInr(extraKmPrice) })}</span>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {kmPlans.map((tier) => {
              const active = tier.plan === kmPlan;
              // Price & KM for the selected trip: whole days at the 24h price + leftover hours at the hourly price
              const tilePrice = tier.dailyPrice * tripDays + tripExtraHours * (tier.hourlyPrice ?? fallbackExtraHourPrice);
              const tileKm = Math.round(tier.km * (tripDays + tripExtraHours / 24));
              return (
                <button
                  key={tier.plan}
                  type="button"
                  onClick={() => setKmPlan(tier.plan)}
                  aria-pressed={active}
                  className={`relative flex flex-col items-center rounded-xl border px-1.5 py-2.5 text-center transition-all ${
                    active
                      ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-500/15"
                      : "border-neutral-200 bg-neutral-50 hover:border-orange-500/40"
                  }`}
                >
                  {tier.isPopular && (
                    <span className="absolute -top-2 rounded-full bg-orange-500 px-2 py-px text-[8px] font-black tracking-wider text-white uppercase">
                      {t("booking.km-popular")}
                    </span>
                  )}
                  <span className="text-sm leading-tight font-black text-neutral-950">{formatInr(tilePrice)}</span>
                  <span className="mt-0.5 text-[11px] font-bold text-neutral-700">{tileKm} km</span>
                  <span className="text-[9px] text-neutral-500">{tripDays > 1 || tripExtraHours > 0 ? tripLabel : t("booking.km-per-day")}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TRIP & DELIVERY OPTIONS */}
      <div className="mt-5 flex flex-col gap-4">
        {/* ── UNIFIED TRIP SCHEDULE PICKER (Single Range & Time Picker) ── */}
        <TripSchedulePicker
          pickup={pickup}
          drop={drop}
          onChange={({ pickup: newP, drop: newD }) => {
            setPickupRaw(newP);
            setDropRaw(newD);
          }}
          minDateTime={nowMin}
          minHours={rentalMode === "HOURLY" ? 1 : 24}
          maxDays={10}
          rentalMode={rentalMode}
        />

        {/* Real-time availability indicator */}
        {(availLoading || isAvailable !== null) && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
              availLoading
                ? "border-neutral-200 bg-neutral-50 text-neutral-500"
                : isAvailable
                  ? "border-emerald-500/30 bg-emerald-50 text-emerald-700"
                  : "border-red-500/30 bg-red-50 text-red-700"
            }`}
          >
            {availLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> {t("booking.checking-availability")}
              </>
            ) : isAvailable ? (
              <>
                <CheckCircle2 className="size-3.5" /> {t("booking.available-for-selected-dates")}
                <span className="ml-auto text-[10px] font-normal text-emerald-600">{t("booking.instant-selection")}</span>
              </>
            ) : (
              <>
                <AlertCircle className="size-3.5" /> {t("booking.not-available-for-selected")}
                <span className="ml-auto text-[10px] font-normal text-red-600">{t("booking.try-other-dates")}</span>
              </>
            )}
          </div>
        )}

        {/* Delivery Mode: Branch / Airport */}
        <div>
          <Label className="text-xs text-neutral-700 font-medium">{t("booking.delivery-handover-point")}</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryType("BRANCH")}
              className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                deliveryType === "BRANCH"
                  ? "border-orange-500 bg-orange-500/10 text-orange-600 shadow-sm"
                  : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              <MapPin className="size-3.5" /> {t("booking.city-branch-office")}
            </button>

            <button
              type="button"
              onClick={() => setDeliveryType("AIRPORT")}
              className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                deliveryType === "AIRPORT"
                  ? "border-orange-500 bg-orange-500/10 text-orange-600 shadow-sm"
                  : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
            >
              <Plane className="size-3.5" /> {t("booking.airport-terminal")}
            </button>
          </div>
        </div>

        {/* Dropdown for Branch or Airport */}
        {deliveryType === "BRANCH" ? (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-neutral-700 font-medium">
                  {differentDropLocation ? t("booking.pickup-branch") : t("booking.branch-both")}
                </Label>
                {!differentDropLocation && (
                  <span className={`text-[11px] font-semibold ${Number(locations.find((l) => l.id === selectedLocationId)?.dropCharge ?? 0) > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                    {Number(locations.find((l) => l.id === selectedLocationId)?.dropCharge ?? 0) > 0
                      ? t("booking.drop-fee", { amount: Number(locations.find((l) => l.id === selectedLocationId)?.dropCharge).toLocaleString("en-IN") })
                      : t("booking.free-drop")}
                  </span>
                )}
              </div>
              <select
                value={selectedLocationId}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  if (!differentDropLocation) {
                    setSelectedDropLocationId(e.target.value);
                  }
                }}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-xs text-neutral-900 outline-none focus:border-orange-500 cursor-pointer shadow-sm"
              >
                {locations.map((loc) => {
                  const charge = Number(loc.dropCharge ?? 0);
                  const priceLabel = charge > 0 ? ` — ${t("booking.drop-fee-amount", { amount: charge.toLocaleString("en-IN") })}` : ` — ${t("booking.free-drop")}`;
                  return (
                    <option key={loc.id} value={loc.id} className="bg-white text-neutral-900">
                      {loc.name} ({loc.city}){priceLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 hover:text-neutral-900 select-none">
              <input
                type="checkbox"
                checked={differentDropLocation}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDifferentDropLocation(checked);
                  if (!checked) {
                    setSelectedDropLocationId(selectedLocationId);
                  }
                }}
                className="rounded border-neutral-300 bg-white accent-orange-500"
              />
              <span>{t("booking.dropoff-at-a-different")}</span>
            </label>

            {differentDropLocation && (
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-neutral-700 font-medium">{t("booking.dropoff-branch-office")}</Label>
                  <span className={`text-[11px] font-semibold ${Number(locations.find((l) => l.id === selectedDropLocationId)?.dropCharge ?? 0) > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                    {Number(locations.find((l) => l.id === selectedDropLocationId)?.dropCharge ?? 0) > 0
                      ? t("booking.drop-fee", { amount: Number(locations.find((l) => l.id === selectedDropLocationId)?.dropCharge).toLocaleString("en-IN") })
                      : t("booking.free-drop")}
                  </span>
                </div>
                <select
                  value={selectedDropLocationId}
                  onChange={(e) => setSelectedDropLocationId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-xs text-neutral-900 outline-none focus:border-orange-500 cursor-pointer shadow-sm"
                >
                  {locations.map((loc) => {
                    const charge = Number(loc.dropCharge ?? 0);
                    const priceLabel = charge > 0 ? ` — ${t("booking.drop-fee-amount", { amount: charge.toLocaleString("en-IN") })}` : ` — ${t("booking.free-drop")}`;
                    return (
                      <option key={loc.id} value={loc.id} className="bg-white text-neutral-900">
                        {loc.name} ({loc.city}){priceLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div>
            <Label className="text-xs text-neutral-700 font-medium">{t("booking.select-airport-terminal")}</Label>
            <select
              value={selectedAirportId}
              onChange={(e) => setSelectedAirportId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-xs text-neutral-900 outline-none focus:border-orange-500 shadow-sm"
            >
              {airports.map((ap) => (
                <option key={ap.id} value={ap.id} className="bg-white text-neutral-900">
                  {ap.name} ({ap.city})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-neutral-500">
              {t("booking.vehicle-will-be-waiting")}
            </p>
          </div>
        )}

        {/* Protection Plan */}
        {insurances.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-950">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600" /> {t("booking.protection-plan")}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">{t("booking.recommended")}</span>
            </div>
            <div className="mt-2.5 flex flex-col gap-2">
              {insurances.map((ins) => {
                const isSelected = selectedInsuranceId === ins.id;
                const priceLabel =
                  Number(ins.dailyPrice ?? ins.fixedPrice) > 0
                    ? `+₹${Number(ins.dailyPrice ?? ins.fixedPrice)}/day`
                    : t("booking.included-free");

                return (
                  <label
                    key={ins.id}
                    className={`flex cursor-pointer items-start justify-between rounded-xl border p-2.5 text-xs transition-all ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-50/50 text-neutral-950 shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="insurancePlan"
                        checked={isSelected}
                        onChange={() => setSelectedInsuranceId(ins.id)}
                        className="mt-0.5 accent-orange-500"
                      />
                      <div>
                        <div className="font-semibold">{ins.name}</div>
                        {ins.description && <div className="text-[10px] text-neutral-500">{ins.description}</div>}
                      </div>
                    </div>
                    <span className="font-bold whitespace-nowrap text-emerald-600">{priceLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Extra Services Checklist */}
        {extraServices.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3.5">
            <div className="text-xs font-bold text-neutral-950">{t("booking.convenience-addons")}</div>
            <div className="mt-2 flex flex-col gap-1.5">
              {extraServices.map((srv) => {
                const checked = selectedExtraIds.includes(srv.id);
                return (
                  <label
                    key={srv.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-2 text-xs transition-all ${
                      checked
                        ? "border-orange-500/40 bg-orange-500/10 text-neutral-950 shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExtra(srv.id)}
                        className="accent-orange-500"
                      />
                      <span>{srv.name}</span>
                    </div>
                    <span className="font-bold text-orange-600">+₹{Number(srv.price).toLocaleString("en-IN")}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Coupon Code Accordion */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-2.5">
          {appliedCoupon ? (
            <div className="flex items-center justify-between text-xs text-emerald-600">
              <span className="flex items-center gap-1 font-bold">
                <Tag className="size-3.5" /> {t("booking.coupon-applied", { code: appliedCoupon })}
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-[11px] text-neutral-500 underline hover:text-neutral-900"
              >
                {t("booking.remove")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <Input
                placeholder={t("booking.promo-code-eg-srm10")}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="h-8 border-neutral-200 bg-white text-xs uppercase text-neutral-900"
              />
              <Button type="submit" size="sm" variant="outline" disabled={isApplyingCoupon} className="h-8 border-neutral-200 bg-white text-xs hover:border-orange-500 hover:text-orange-600">
                {isApplyingCoupon ? <Loader2 className="size-3 animate-spin" /> : t("booking.apply")}
              </Button>
            </form>
          )}
        </div>

        {/* Pricing Breakdown Summary */}
        {calcLoading ? (
          <div className="flex items-center justify-center py-4 text-xs text-neutral-500">
            <Loader2 className="mr-2 size-4 animate-spin text-orange-500" /> {t("booking.updating-live-price")}
          </div>
        ) : pricingResult ? (
          <div className="relative rounded-2xl border border-dashed border-neutral-300 bg-gradient-to-b from-amber-50/40 to-neutral-50/70 p-4 text-xs before:absolute before:top-1/2 before:-left-2 before:size-4 before:-translate-y-1/2 before:rounded-full before:border before:border-neutral-200 before:bg-white after:absolute after:top-1/2 after:-right-2 after:size-4 after:-translate-y-1/2 after:rounded-full after:border after:border-neutral-200 after:bg-white">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-neutral-600">
                <span>{t("booking.base-rental", { days: pricingResult.duration.fullDays || 1 })}</span>
                <span>{formatInr(pricingResult.rental.basePrice)}</span>
              </div>

              {pricingResult.rental.extraHourCharge > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>{t("booking.extra-hours", { hours: pricingResult.duration.extraHours })}</span>
                  <span>{formatInr(pricingResult.rental.extraHourCharge)}</span>
                </div>
              )}

              {pricingResult.airport.pickupCharge + pricingResult.airport.dropCharge > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>{t("booking.airport-delivery-fee")}</span>
                  <span>{formatInr(pricingResult.airport.pickupCharge + pricingResult.airport.dropCharge)}</span>
                </div>
              )}

              {pricingResult.locationDropCharge > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>{t("booking.drop-location-fee")}</span>
                  <span>{formatInr(pricingResult.locationDropCharge)}</span>
                </div>
              )}

              {pricingResult.insurance && pricingResult.insurance.price > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>{t("booking.protection-plan-2")}</span>
                  <span>{formatInr(pricingResult.insurance.price)}</span>
                </div>
              )}

              {pricingResult.services && pricingResult.services.length > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>{t("booking.addons")}</span>
                  <span>{formatInr(pricingResult.services.reduce((sum, s) => sum + s.price, 0))}</span>
                </div>
              )}

              {pricingResult.discount > 0 && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>{t("booking.discount")}</span>
                  <span>-{formatInr(pricingResult.discount)}</span>
                </div>
              )}

              {pricingResult.totalTax > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>GST (Taxes)</span>
                  <span>{formatInr(pricingResult.totalTax)}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-dashed border-neutral-300 pt-2.5 text-sm font-black text-neutral-950">
                <span>{t("booking.total-payable")}</span>
                <span className="text-gradient-gold text-xl">{formatInr(pricingResult.total)}</span>
              </div>

              {advancePercent > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-neutral-900 px-3 py-2 text-[11px] text-white/80">
                <span>
                  {t("booking.reserve-now-with")} <strong className="text-amber-300">{advancePercent}%</strong>
                </span>
                <span className="font-black text-amber-300">{formatInr(splitAdvance(pricingResult.total, advancePercent).now)}</span>
              </div>
              )}

              <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-600">
                <span>{t("booking.refundable-security-deposit")}</span>
                <span>{formatInr(securityDeposit)} (at pickup)</span>
              </div>
            </div>
          </div>
        ) : null}

        {calcError && <p className="text-xs text-red-500">{calcError}</p>}

        {/* Primary CTA: Add to Cart */}
        <Button
          type="button"
          onClick={handleAddToCart}
          disabled={availLoading || isAvailable === false || calcLoading || isAdding}
          className="shimmer-sheen relative mt-3 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-500/30 transition-all hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAdding ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> {t("booking.adding-to-cart")}
            </>
          ) : availLoading || calcLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> {t("booking.checking-availability-rates")}
            </>
          ) : isAvailable === false ? (
            t("booking.unavailable")
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShoppingBag className="size-4" /> {t("booking.add-to-cart")} •{" "}
              {formatInr(pricingResult?.total ?? (rentalMode === "HOURLY" ? Number(hourlyPrice || 500) : dailyPrice))}
            </span>
          )}
        </Button>

        {/* Secondary CTA: Book on WhatsApp */}
        <Button
          type="button"
          onClick={handleWhatsAppBook}
          disabled={availLoading || isAvailable === false}
          className="w-full rounded-2xl bg-[#25D366] py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-[#1ebe5a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            <MessageCircle className="size-4" /> {t("booking.book-on-whatsapp")}
          </span>
        </Button>
      </div>

      {/* Support call fallback */}
      {phone && (
        <div className="mt-4 border-t border-neutral-200 pt-3 text-center">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-orange-600 transition"
          >
            <Phone className="size-3.5 text-orange-500" /> Prefer booking over phone? Call {phone}
          </a>
        </div>
      )}
    </div>
  );
}
