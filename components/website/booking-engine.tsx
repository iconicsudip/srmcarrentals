"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Plane,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
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
  includedKmPerDay: number;
  phone: string;
  locations: { id: string; name: string; city: string; state: string }[];
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
function addDaysToDate(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

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
  dailyPrice,
  hourlyPrice,
  includedKmPerDay,
  phone,
  locations,
  airports,
  insurances,
  extraServices,
}: BookingEngineProps) {
  const searchParams = useSearchParams();

  const qLocationId = searchParams.get("locationId") ?? searchParams.get("location");
  const qPickup = searchParams.get("pickupDate");
  const qDrop = searchParams.get("dropDate");

  // Mode: "DAILY" or "HOURLY"
  const hasHourly = hourlyPrice != null && Number(hourlyPrice) > 0;
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
  const dropMinDateTime = addHoursToISO(pickup, 24);          // drop must be >= pickup + 24h
  const dropMaxDate = addDaysToDate(pickup.slice(0, 10), 10); // drop must be <= pickup + 10 days

  // When pickup changes: enforce drop is within [pickup+24h, pickup+10d]
  const handlePickupChange = (newPickup: string) => {
    setPickupRaw(newPickup);
    const minDrop = addHoursToISO(newPickup, 24);
    const maxDrop = addHoursToISO(newPickup, 24 * 10);
    setDropRaw((prev) => {
      if (prev < minDrop) return minDrop;
      if (prev > maxDrop) return maxDrop;
      return prev;
    });
  };

  // When drop changes: clamp to [pickup+24h, pickup+10d]
  const handleDropChange = (newDrop: string) => {
    const minDrop = addHoursToISO(pickup, 24);
    const maxDrop = addHoursToISO(pickup, 24 * 10);
    if (newDrop < minDrop) setDropRaw(minDrop);
    else if (newDrop > maxDrop) setDropRaw(maxDrop);
    else setDropRaw(newDrop);
  };

  // Locations
  const [deliveryType, setDeliveryType] = React.useState<"BRANCH" | "AIRPORT" | "DOORSTEP">("BRANCH");
  const [selectedLocationId, setSelectedLocationId] = React.useState<string>(() => {
    if (qLocationId && locations.some((l) => l.id === qLocationId)) {
      return qLocationId;
    }
    return locations[0]?.id ?? "";
  });
  const [selectedAirportId, setSelectedAirportId] = React.useState<string>(airports[0]?.id ?? "");

  // Distance estimation
  const [estimatedKm, setEstimatedKm] = React.useState<string>("300");

  // Add-ons & Protection
  const [selectedInsuranceId, setSelectedInsuranceId] = React.useState<string | undefined>(
    insurances.find((i) => Number(i.dailyPrice ?? i.fixedPrice) > 0)?.id,
  );
  const [selectedExtraIds, setSelectedExtraIds] = React.useState<string[]>([]);

  // Coupon
  const [couponInput, setCouponInput] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | undefined>(undefined);

  // Availability check state
  const [availLoading, setAvailLoading] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState<boolean | null>(null);

  // Pricing calculation state
  const [calcLoading, setCalcLoading] = React.useState(false);
  const [pricingResult, setPricingResult] = React.useState<PricingCalculateResponse | null>(null);
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
          dropLocationId: deliveryType === "BRANCH" ? selectedLocationId : undefined,
          pickupIsAirport: deliveryType === "AIRPORT",
          dropIsAirport: deliveryType === "AIRPORT",
          pickupAirportId: deliveryType === "AIRPORT" ? selectedAirportId : undefined,
          dropAirportId: deliveryType === "AIRPORT" ? selectedAirportId : undefined,
          estimatedKm: Number(estimatedKm) || 0,
          insuranceId: selectedInsuranceId,
          extraServiceIds: selectedExtraIds,
          couponCode: appliedCoupon,
        },
        skipAuthRedirect: true,
      });
      setPricingResult(response);
    } catch (err) {
      setCalcError(err instanceof ApiRequestError ? err.message : "Unable to calculate pricing.");
    } finally {
      setCalcLoading(false);
    }
  }, [
    carId,
    pickup,
    drop,
    deliveryType,
    selectedLocationId,
    selectedAirportId,
    estimatedKm,
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
    setAppliedCoupon(couponInput.trim().toUpperCase());
    toast.success(`Checking coupon ${couponInput.trim().toUpperCase()}...`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(undefined);
    setCouponInput("");
  };

  const toggleExtra = (id: string) => {
    setSelectedExtraIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Add configuration directly to Cart
  const handleAddToCart = () => {
    if (!pickup || !drop || new Date(drop) <= new Date(pickup)) {
      toast.error("Please select valid pickup and drop dates.");
      return;
    }
    if (isAvailable === false) {
      toast.error("This car is unavailable for the selected dates. Please adjust your dates.");
      return;
    }

    const selectedBranch = locations.find((l) => l.id === selectedLocationId);
    const selectedAirport = airports.find((a) => a.id === selectedAirportId);
    const selectedInsurance = insurances.find((i) => i.id === selectedInsuranceId);
    const chosenExtras = extraServices.filter((e) => selectedExtraIds.includes(e.id));

    const unitPrice = rentalMode === "HOURLY" ? Number(hourlyPrice || 500) : dailyPrice;
    const rawTotal = pricingResult?.total;
    const finalTotal = Number.isFinite(rawTotal) ? (rawTotal as number) : unitPrice;

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
      deliveryType,
      locationName:
        deliveryType === "BRANCH"
          ? selectedBranch
            ? `${selectedBranch.name} (${selectedBranch.city})`
            : "City Branch"
          : selectedAirport
            ? `${selectedAirport.name} (${selectedAirport.code})`
            : "Airport Terminal",
      pickupLocationId: deliveryType === "BRANCH" ? selectedLocationId : undefined,
      dropLocationId: deliveryType === "BRANCH" ? selectedLocationId : undefined,
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
    });

    toast.success(`${carName} added to your cart!`);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-neutral-900/90 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-orange-400 uppercase">Self-Drive Reservation</span>
          <h3 className="text-xl font-black text-white">{carName}</h3>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-orange-400">
            {rentalMode === "HOURLY" && hasHourly
              ? `₹${Number(hourlyPrice).toLocaleString("en-IN")}/hr`
              : `₹${Number(dailyPrice).toLocaleString("en-IN")}/day`}
          </div>
          <span className="text-[10px] text-white/50">{rentalMode === "HOURLY" ? "Flexible Hours" : "24-Hour Block"}</span>
        </div>
      </div>

      {/* Mode Switch: Daily vs Hourly */}
      {hasHourly && (
        <div className="mt-4 flex rounded-xl border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => handleModeToggle("DAILY")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              rentalMode === "DAILY"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            Daily Rental (24h)
          </button>
          <button
            type="button"
            onClick={() => handleModeToggle("HOURLY")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              rentalMode === "HOURLY"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-white/60 hover:text-white"
            }`}
          >
            Hourly Rental (₹{Number(hourlyPrice).toLocaleString("en-IN")}/hr)
          </button>
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
                ? "border-white/10 bg-white/5 text-white/50"
                : isAvailable
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {availLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Checking availability…
              </>
            ) : isAvailable ? (
              <>
                <CheckCircle2 className="size-3.5" /> Available for selected dates
                <span className="ml-auto text-[10px] font-normal text-emerald-400/60">✓ Instant Selection</span>
              </>
            ) : (
              <>
                <AlertCircle className="size-3.5" /> Not available for selected dates
                <span className="ml-auto text-[10px] font-normal text-red-400/60">Try other dates</span>
              </>
            )}
          </div>
        )}

        {/* Delivery Mode: Branch / Airport */}
        <div>
          <Label className="text-xs text-white/60">Delivery & Handover Point</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryType("BRANCH")}
              className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                deliveryType === "BRANCH"
                  ? "border-orange-500 bg-orange-500/10 text-orange-400"
                  : "border-white/10 bg-black/30 text-white/60 hover:text-white"
              }`}
            >
              <MapPin className="size-3.5" /> City Branch Office
            </button>

            <button
              type="button"
              onClick={() => setDeliveryType("AIRPORT")}
              className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                deliveryType === "AIRPORT"
                  ? "border-orange-500 bg-orange-500/10 text-orange-400"
                  : "border-white/10 bg-black/30 text-white/60 hover:text-white"
              }`}
            >
              <Plane className="size-3.5" /> Airport Terminal
            </button>
          </div>
        </div>

        {/* Dropdown for Branch or Airport */}
        {deliveryType === "BRANCH" ? (
          <div>
            <Label className="text-xs text-white/60">Select Branch Office</Label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-xs text-white outline-none focus:border-orange-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-neutral-900 text-white">
                  {loc.name} ({loc.city})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <Label className="text-xs text-white/60">Select Airport Terminal</Label>
            <select
              value={selectedAirportId}
              onChange={(e) => setSelectedAirportId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-xs text-white outline-none focus:border-orange-500"
            >
              {airports.map((ap) => (
                <option key={ap.id} value={ap.id} className="bg-neutral-900 text-white">
                  {ap.name} ({ap.city})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-white/40">
              Vehicle will be waiting at Arrivals gate with flight-tracked handover.
            </p>
          </div>
        )}

        {/* Protection Plan */}
        {insurances.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-400" /> Protection Plan
              </span>
              <span className="text-[11px] text-emerald-400">Recommended</span>
            </div>
            <div className="mt-2.5 flex flex-col gap-2">
              {insurances.map((ins) => {
                const isSelected = selectedInsuranceId === ins.id;
                const priceLabel =
                  Number(ins.dailyPrice ?? ins.fixedPrice) > 0
                    ? `+₹${Number(ins.dailyPrice ?? ins.fixedPrice)}/day`
                    : "Included Free";

                return (
                  <label
                    key={ins.id}
                    className={`flex cursor-pointer items-start justify-between rounded-xl border p-2.5 text-xs transition-all ${
                      isSelected
                        ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                        : "border-white/5 bg-white/5 text-white/60 hover:text-white"
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
                        {ins.description && <div className="text-[10px] text-white/40">{ins.description}</div>}
                      </div>
                    </div>
                    <span className="font-bold whitespace-nowrap text-emerald-400">{priceLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Extra Services Checklist */}
        {extraServices.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5">
            <div className="text-xs font-bold text-white">Convenience Add-ons</div>
            <div className="mt-2 flex flex-col gap-1.5">
              {extraServices.map((srv) => {
                const checked = selectedExtraIds.includes(srv.id);
                return (
                  <label
                    key={srv.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-2 text-xs transition-all ${
                      checked
                        ? "border-orange-500/40 bg-orange-500/10 text-white"
                        : "border-white/5 bg-white/5 text-white/60 hover:text-white"
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
                    <span className="font-bold text-orange-400">+₹{Number(srv.price).toLocaleString("en-IN")}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Coupon Code Accordion */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-2.5">
          {appliedCoupon ? (
            <div className="flex items-center justify-between text-xs text-emerald-400">
              <span className="flex items-center gap-1 font-bold">
                <Tag className="size-3.5" /> Coupon &ldquo;{appliedCoupon}&rdquo; applied!
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-[11px] text-white/50 underline hover:text-white"
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <Input
                placeholder="Promo Code (e.g. SRM10)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="h-8 border-white/10 bg-black/40 text-xs uppercase"
              />
              <Button type="submit" size="sm" variant="outline" className="h-8 border-white/20 text-xs">
                Apply
              </Button>
            </form>
          )}
        </div>

        {/* Pricing Breakdown Summary */}
        {calcLoading ? (
          <div className="flex items-center justify-center py-4 text-xs text-white/50">
            <Loader2 className="mr-2 size-4 animate-spin text-orange-400" /> Updating live price...
          </div>
        ) : pricingResult ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-white/70">
                <span>Base Rental ({pricingResult.duration.fullDays || 1} day(s))</span>
                <span>{formatInr(pricingResult.rental.basePrice)}</span>
              </div>

              {pricingResult.rental.extraHourCharge > 0 && (
                <div className="flex justify-between text-white/70">
                  <span>Extra Hours ({pricingResult.duration.extraHours}h)</span>
                  <span>{formatInr(pricingResult.rental.extraHourCharge)}</span>
                </div>
              )}

              {pricingResult.airport.pickupCharge + pricingResult.airport.dropCharge > 0 && (
                <div className="flex justify-between text-white/70">
                  <span>Airport Delivery Fee</span>
                  <span>{formatInr(pricingResult.airport.pickupCharge + pricingResult.airport.dropCharge)}</span>
                </div>
              )}

              {pricingResult.insurance && pricingResult.insurance.price > 0 && (
                <div className="flex justify-between text-white/70">
                  <span>Protection Plan</span>
                  <span>{formatInr(pricingResult.insurance.price)}</span>
                </div>
              )}

              {pricingResult.services && pricingResult.services.length > 0 && (
                <div className="flex justify-between text-white/70">
                  <span>Add-ons</span>
                  <span>{formatInr(pricingResult.services.reduce((sum, s) => sum + s.price, 0))}</span>
                </div>
              )}

              {pricingResult.discount > 0 && (
                <div className="flex justify-between font-bold text-emerald-400">
                  <span>Discount</span>
                  <span>-{formatInr(pricingResult.discount)}</span>
                </div>
              )}

              {pricingResult.totalTax > 0 && (
                <div className="flex justify-between text-white/40">
                  <span>GST (Taxes)</span>
                  <span>{formatInr(pricingResult.totalTax)}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm font-black text-white">
                <span>Total Payable</span>
                <span className="text-base text-orange-400">{formatInr(pricingResult.total)}</span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-400">
                <span>Refundable Security Deposit</span>
                <span>₹3,000–₹5,000 (at pickup)</span>
              </div>
            </div>
          </div>
        ) : null}

        {calcError && <p className="text-xs text-red-400">{calcError}</p>}

        {/* Primary CTA: Add to Cart */}
        <Button
          type="button"
          onClick={handleAddToCart}
          disabled={availLoading || isAvailable === false || calcLoading}
          className="mt-3 w-full rounded-2xl bg-orange-500 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {availLoading || calcLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Checking availability & rates…
            </>
          ) : isAvailable === false ? (
            "Car unavailable for selected dates"
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShoppingBag className="size-4" /> Add to Cart •{" "}
              {formatInr(pricingResult?.total ?? (rentalMode === "HOURLY" ? Number(hourlyPrice || 500) : dailyPrice))}
            </span>
          )}
        </Button>
      </div>

      {/* Support call fallback */}
      {phone && (
        <div className="mt-4 border-t border-white/10 pt-3 text-center">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white"
          >
            <Phone className="size-3.5 text-orange-400" /> Prefer booking over phone? Call {phone}
          </a>
        </div>
      )}
    </div>
  );
}
