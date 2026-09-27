"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Headphones,
  MapPin,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { TripSchedulePicker } from "@/components/website/datetime-picker";
import { apiFetch } from "@/lib/api-client";
import type { AvailableServicesConfig, CompanyContent } from "@/modules/settings/site-content.schemas";

interface LocationOption {
  id: string;
  name: string;
  city?: string;
  dropCharge?: number | string;
}

interface BookingWidgetProps {
  locations?: LocationOption[];
  defaultMode?: "self-drive" | "chauffeur";
  services?: AvailableServicesConfig;
}

function defaultDateTimeStr(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3_600_000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

export function BookingWidget({
  locations: initialLocations = [],
  defaultMode = "self-drive",
  services = { cars: true, taxi: true, tours: true },
}: BookingWidgetProps) {
  const router = useRouter();

  const [mode, setMode] = React.useState<"self-drive" | "chauffeur">(
    defaultMode === "self-drive" && !services.cars ? "chauffeur" : defaultMode,
  );

  // Dynamically managed locations from API or props
  const [locations, setLocations] = React.useState<LocationOption[]>(initialLocations);
  const [locationId, setLocationId] = React.useState<string>(initialLocations[0]?.id ?? "");
  const [dropAddress, setDropAddress] = React.useState("Doorstep Delivery (Hotel / Airport / Home)");

  // Dynamically calculated default dates
  const [pickupDateTime, setPickupDateTime] = React.useState(defaultDateTimeStr(24));
  const [dropDateTime, setDropDateTime] = React.useState(defaultDateTimeStr(48));

  // Dynamically fetched company phone and support details
  const [phone, setPhone] = React.useState("+91 9414551250");

  // Load locations and company settings dynamically from server
  React.useEffect(() => {
    let cancelled = false;

    // Fetch locations dynamically if not provided or to ensure fresh data
    if (initialLocations.length === 0) {
      apiFetch<{ data: any[] }>("/locations?limit=50", { skipAuthRedirect: true })
        .then((res) => {
          if (!cancelled && res?.data && res.data.length > 0) {
            const locs: LocationOption[] = res.data.map((l: any) => ({
              id: l.id,
              name: l.name,
              city: l.city,
              dropCharge: Number(l.dropCharge ?? 0),
            }));
            setLocations(locs);
            if (!locationId) setLocationId(locs[0]?.id ?? "");
          }
        })
        .catch(() => {});
    }

    // Fetch dynamic company support helpline
    apiFetch<CompanyContent>("/settings/homepage.company", { skipAuthRedirect: true })
      .then((data) => {
        if (!cancelled && data?.phone) {
          setPhone(data.phone);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [initialLocations, locationId]);

  // Group locations dynamically by City
  const locationsByCity = React.useMemo(() => {
    const map = new Map<string, LocationOption[]>();
    for (const loc of locations) {
      const city = loc.city?.trim() || "Rajasthan";
      if (!map.has(city)) map.set(city, []);
      map.get(city)!.push(loc);
    }
    return map;
  }, [locations]);

  // Ensure a location is selected
  React.useEffect(() => {
    if (!locationId && locations.length > 0 && locations[0]?.id) {
      setLocationId(locations[0].id);
    }
  }, [locationId, locations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    const selectedLoc = locations.find((l) => l.id === locationId);
    if (selectedLoc) {
      params.set("locationId", selectedLoc.id);
      if (selectedLoc.city) params.set("city", selectedLoc.city);
    }

    if (pickupDateTime) params.set("pickupDate", new Date(pickupDateTime).toISOString());
    if (dropDateTime) params.set("dropDate", new Date(dropDateTime).toISOString());

    if (mode === "chauffeur" && dropAddress.trim()) {
      params.set("dropAddress", dropAddress.trim());
    }

    router.push(mode === "self-drive" ? `/cars?${params.toString()}` : `/car-rental?${params.toString()}`);
  };

  return (
    <div className="relative z-20 mx-auto w-full max-w-7xl rounded-3xl border border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur-xl">
      {/* Top bar: Tabs + Hint */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
        <div className="flex w-fit rounded-full bg-white/5 p-1 border border-white/5">
          {services.cars && (
            <button
              type="button"
              id="booking-widget-tab-self-drive"
              onClick={() => setMode("self-drive")}
              className={`rounded-full px-5 py-2 text-xs font-bold tracking-wide transition-all cursor-pointer ${
                mode === "self-drive"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "text-white/50 hover:text-white"
              }`}
            >
              SELF DRIVE
            </button>
          )}
          {services.taxi && (
            <button
              type="button"
              id="booking-widget-tab-chauffeur"
              onClick={() => setMode("chauffeur")}
              className={`rounded-full px-5 py-2 text-xs font-bold tracking-wide transition-all cursor-pointer ${
                mode === "chauffeur"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "text-white/50 hover:text-white"
              }`}
            >
              TAXI / CHAUFFEUR
            </button>
          )}
        </div>

        <span className="hidden items-center gap-1.5 text-xs text-white/40 sm:flex">
          <Sparkles className="size-3.5 text-orange-500/60" />
          Instant delivery to Airport, Railway Station or Hotel
        </span>
      </div>

      {/* Main Form Fields */}
      <form onSubmit={handleSearch} className="px-5 pt-4 pb-4">
        <div
          className={`grid items-end gap-3.5 ${
            mode === "chauffeur"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.3fr_2fr_auto]"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_2.4fr_auto]"
          }`}
        >
          {/* 1. SELECT LOCATION / CITY (Dynamically Loaded & Grouped) */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
              Pickup City / Branch
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-orange-500" />
              <select
                id="booking-widget-location-select"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="h-11 sm:h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/5 pl-10 pr-9 text-xs sm:text-sm font-semibold text-white outline-none transition hover:border-orange-500/40 hover:bg-white/8 focus:border-orange-500 focus:bg-white/10 cursor-pointer"
              >
                {Array.from(locationsByCity.entries()).map(([city, locs]) => (
                  <optgroup key={city} label={city} className="bg-neutral-900 text-white font-bold">
                    {locs.map((loc) => {
                      const charge = Number(loc.dropCharge ?? 0);
                      const priceLabel = charge > 0 ? ` (+₹${charge.toLocaleString("en-IN")} Drop)` : "";
                      return (
                        <option key={loc.id} value={loc.id} className="bg-neutral-900 text-white font-normal py-1">
                          {loc.name}{priceLabel}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            </div>
          </div>

          {/* 2. DROP LOCATION (Only in Chauffeur/Taxi mode) */}
          {mode === "chauffeur" && (
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                Drop Location
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-orange-400" />
                <input
                  type="text"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="Drop Location / Hotel / Airport"
                  className="h-11 sm:h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 text-xs sm:text-sm font-medium text-white outline-none placeholder:text-white/30 transition hover:border-orange-500/40 focus:border-orange-500 focus:bg-white/10"
                />
              </div>
            </div>
          )}

          {/* 3. UNIFIED TRIP SCHEDULE PICKER (Like Others on Site) */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
              Trip Schedule &amp; Dates
            </label>
            <TripSchedulePicker
              pickup={pickupDateTime}
              drop={dropDateTime}
              onChange={({ pickup, drop }) => {
                setPickupDateTime(pickup);
                setDropDateTime(drop);
              }}
              minHours={mode === "chauffeur" ? 1 : 24}
              maxDays={30}
              rentalMode={mode === "chauffeur" ? "HOURLY" : "DAILY"}
              compact
            />
          </div>

          {/* 4. SEARCH BUTTON */}
          <div className="flex flex-col justify-end">
            <button
              type="submit"
              id="booking-widget-search-btn"
              className="flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-7 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-orange-500/40 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Search className="size-4 shrink-0 stroke-[2.5]" />
              <span>{mode === "self-drive" ? "SEARCH CARS" : "FIND TAXI"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Duration Info Notice */}
        <div className="mt-3.5 flex justify-center">
          <div className="w-full sm:w-auto rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-center text-xs font-medium text-sky-300">
            {mode === "self-drive"
              ? "Pickup and return time must be at least 24 hours apart and maximum 30 days."
              : "Flexible hourly packages and outstation taxi routes available across Rajasthan & Gujarat."}
          </div>
        </div>
      </form>

      {/* Trust Badges Strip (Dynamically Managed Phone/Helpline) */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/5 px-5 py-3">
        <span className="flex items-center gap-1.5 text-[11px] text-white/40">
          <CheckCircle2 className="size-3.5 shrink-0 text-orange-500/70" />
          <span>
            <span className="font-semibold text-white/60">Verified Cars</span>{" "}
            <span className="text-white/30">(100% Insured &amp; Cleaned)</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-white/40">
          <Tag className="size-3.5 shrink-0 text-orange-500/70" />
          <span>
            <span className="font-semibold text-white/60">Transparent Pricing</span>{" "}
            <span className="text-white/30">(Zero Hidden Extras)</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-white/40">
          <Headphones className="size-3.5 shrink-0 text-orange-500/70" />
          <span>
            <span className="font-semibold text-white/60">24/7 Roadside Support</span>{" "}
            <span className="text-white/30">({phone})</span>
          </span>
        </span>
      </div>
    </div>
  );
}
