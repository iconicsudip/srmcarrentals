"use client";

import { pickupPointsOnly } from "@/lib/location-points";
import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Headphones, Loader2, MapPin, Search, Sparkles, Tag } from "lucide-react";
import { TripSchedulePicker } from "@/components/website/datetime-picker";
import { apiFetch } from "@/lib/api-client";
import type { AvailableServicesConfig, CompanyContent, SiteText } from "@/modules/settings/site-content.schemas";

interface LocationOption {
  id: string;
  slug?: string;
  name: string;
  city?: string;
  dropCharge?: number | string;
}

interface BookingWidgetProps {
  locations?: LocationOption[];
  defaultMode?: "self-drive" | "chauffeur";
  services?: AvailableServicesConfig;
  text?: SiteText["bookingWidget"];
}

/** Fallback copy for pages that don't pass admin-managed text. */
const DEFAULT_WIDGET_TEXT: SiteText["bookingWidget"] = {
  selfDriveTab: "SELF DRIVE",
  taxiTab: "TAXI / CHAUFFEUR",
  hint: "Instant delivery to Airport, Railway Station or Hotel",
  searchCarsLabel: "SEARCH CARS",
  findTaxiLabel: "FIND TAXI",
  selfDriveNotice: "Pickup and return time must be at least 24 hours apart and maximum 30 days.",
  taxiNotice: "Flexible hourly packages and outstation taxi routes available across Rajasthan & Gujarat.",
  trust1Title: "Verified Cars",
  trust1Detail: "(100% Insured & Cleaned)",
  trust2Title: "Transparent Pricing",
  trust2Detail: "(Zero Hidden Extras)",
  trust3Title: "24/7 Roadside Support",
};

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
  text = DEFAULT_WIDGET_TEXT,
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
  const [isSearching, setIsSearching] = React.useState(false);

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
    for (const loc of pickupPointsOnly(locations)) {
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

  // Self-drive search is city based (the pickup & drop point are chosen later, when confirming the booking)
  const cityNames = Array.from(locationsByCity.keys());
  const [cityValue, setCityValue] = React.useState<string>("");
  const activeCity = cityValue && cityNames.includes(cityValue) ? cityValue : cityNames[0] ?? "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    if (mode === "self-drive") {
      if (activeCity) params.set("city", activeCity);
    } else {
      const selectedLoc = locations.find((l) => l.id === locationId);
      if (selectedLoc) {
        params.set("location", selectedLoc.slug ?? selectedLoc.id);
        if (selectedLoc.city) params.set("city", selectedLoc.city);
      }
    }

    if (pickupDateTime) params.set("pickupDate", new Date(pickupDateTime).toISOString());
    if (dropDateTime) params.set("dropDate", new Date(dropDateTime).toISOString());

    if (mode === "chauffeur" && dropAddress.trim()) {
      params.set("dropAddress", dropAddress.trim());
    }

    setIsSearching(true);
    router.push(mode === "self-drive" ? `/cars?${params.toString()}` : `/car-rental?${params.toString()}`);
  };

  return (
    <div className="relative z-20 mx-auto w-full max-w-[1520px] rounded-3xl border border-neutral-200/90 bg-white/95 shadow-2xl shadow-neutral-950/10 backdrop-blur-xl">
      {/* Top bar: Tabs + Hint */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100">
        <div className="flex w-fit rounded-full bg-neutral-100/90 p-1 border border-neutral-200/80">
          {services.cars && (
            <button
              type="button"
              id="booking-widget-tab-self-drive"
              onClick={() => setMode("self-drive")}
              className={`rounded-full px-5 py-2 text-xs font-bold tracking-wide transition-all cursor-pointer ${
                mode === "self-drive"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                  : "text-neutral-600 hover:text-neutral-950"
              }`}
            >
              {text.selfDriveTab}
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
                  : "text-neutral-600 hover:text-neutral-950"
              }`}
            >
              {text.taxiTab}
            </button>
          )}
        </div>

        <span className="hidden items-center gap-1.5 text-xs text-neutral-500 sm:flex font-medium">
          <Sparkles className="size-3.5 text-orange-500" />
          {text.hint}
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
          {/* 1. SELECT CITY (self-drive) — pickup & drop points come later, at booking time */}
          {mode === "self-drive" ? (
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase">Pickup City</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-orange-500" />
                <select
                  id="booking-widget-location-select"
                  value={activeCity}
                  onChange={(e) => setCityValue(e.target.value)}
                  className="h-11 sm:h-12 w-full appearance-none rounded-xl border border-neutral-200 bg-white pl-10 pr-9 text-xs sm:text-sm font-semibold text-neutral-900 outline-none transition hover:border-orange-500/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 cursor-pointer shadow-xs"
                >
                  {cityNames.map((c) => (
                    <option key={c} value={c} className="bg-white text-neutral-900">
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>
          ) : (
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase">
              Pickup City / Branch
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-orange-500" />
              <select
                id="booking-widget-location-select"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="h-11 sm:h-12 w-full appearance-none rounded-xl border border-neutral-200 bg-white pl-10 pr-9 text-xs sm:text-sm font-semibold text-neutral-900 outline-none transition hover:border-orange-500/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 cursor-pointer shadow-xs"
              >
                {Array.from(locationsByCity.entries()).map(([city, locs]) => (
                  <optgroup key={city} label={city} className="bg-white text-neutral-950 font-bold">
                    {locs.map((loc) => {
                      const charge = Number(loc.dropCharge ?? 0);
                      const priceLabel = charge > 0 ? ` (+₹${charge.toLocaleString("en-IN")} Drop)` : "";
                      return (
                        <option key={loc.id} value={loc.id} className="bg-white text-neutral-900 font-normal py-1">
                          {loc.name}{priceLabel}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            </div>
          </div>
          )}

          {/* 2. DROP LOCATION (Only in Chauffeur/Taxi mode) */}
          {mode === "chauffeur" && (
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase">
                Drop Location
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-orange-500" />
                <select
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  aria-label="Drop location"
                  className="h-11 sm:h-12 w-full appearance-none rounded-xl border border-neutral-200 bg-white pl-10 pr-9 text-xs sm:text-sm font-semibold text-neutral-900 outline-none transition hover:border-orange-500/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 cursor-pointer shadow-xs"
                >
                  <option value="Doorstep Delivery (Hotel / Airport / Home)">Doorstep Delivery (Hotel / Airport / Home)</option>
                  {Array.from(locationsByCity.entries()).map(([city, locs]) => (
                    <optgroup key={city} label={city}>
                      {locs.map((loc) => (
                        <option key={loc.id} value={`${loc.name}, ${city}`}>
                          {loc.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>
          )}

          {/* 3. UNIFIED TRIP SCHEDULE PICKER (Like Others on Site) */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <label className="text-[10px] font-bold tracking-widest text-neutral-600 uppercase">
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
              disabled={isSearching}
              className="flex h-11 sm:h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-7 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-orange-500/40 active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                  <span>Searching Fleet...</span>
                </>
              ) : (
                <>
                  <Search className="size-4 shrink-0 stroke-[2.5]" />
                  <span>{mode === "self-drive" ? text.searchCarsLabel : text.findTaxiLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Duration Info Notice */}
        <div className="mt-3.5 flex justify-center">
          <div className="w-full sm:w-auto rounded-lg border border-orange-500/20 bg-orange-50/80 px-4 py-1.5 text-center text-xs font-medium text-orange-950">
            {mode === "self-drive"
              ? text.selfDriveNotice
              : text.taxiNotice}
          </div>
        </div>
      </form>

      {/* Trust Badges Strip (Dynamically Managed Phone/Helpline) */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-neutral-100 bg-neutral-50/60 rounded-b-3xl px-5 py-3">
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-600">
          <CheckCircle2 className="size-3.5 shrink-0 text-orange-500" />
          <span>
            <span className="font-semibold text-neutral-900">{text.trust1Title}</span>{" "}
            <span className="text-neutral-500">{text.trust1Detail}</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-600">
          <Tag className="size-3.5 shrink-0 text-orange-500" />
          <span>
            <span className="font-semibold text-neutral-900">{text.trust2Title}</span>{" "}
            <span className="text-neutral-500">{text.trust2Detail}</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-neutral-600">
          <Headphones className="size-3.5 shrink-0 text-orange-500" />
          <span>
            <span className="font-semibold text-neutral-900">{text.trust3Title}</span>{" "}
            <span className="text-neutral-500">({phone})</span>
          </span>
        </span>
      </div>
    </div>
  );
}
