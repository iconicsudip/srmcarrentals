"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Search, Sparkles, CheckCircle2, Tag, Headphones } from "lucide-react";
import { TripSchedulePicker } from "@/components/website/datetime-picker";

import type { AvailableServicesConfig } from "@/modules/settings/site-content.schemas";

interface LocationOption {
  id: string;
  name: string;
}

interface BookingWidgetProps {
  locations: LocationOption[];
  defaultMode?: "self-drive" | "chauffeur";
  services?: AvailableServicesConfig;
}

function defaultDateTimeStr(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3_600_000);
  d.setMinutes(0, 0, 0);
  // Return as local datetime-local value string (YYYY-MM-DDTHH:mm)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

function formatDisplayDateTime(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  try {
    const d = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    return {
      date: `${day}/${month}/${year}`,
      time: `${displayHour}:${minutes} ${ampm}`,
    };
  } catch {
    return { date: "", time: "" };
  }
}

export function BookingWidget({
  locations,
  defaultMode = "self-drive",
  services = { cars: true, taxi: true, tours: true },
}: BookingWidgetProps) {
  const router = useRouter();
  const initialMode = services.cars ? "self-drive" : "chauffeur";
  const [mode, setMode] = React.useState<"self-drive" | "chauffeur">(
    defaultMode === "self-drive" && !services.cars ? "chauffeur" : defaultMode,
  );
  const [locationId, setLocationId] = React.useState<string>(locations[0]?.id ?? "");
  const [dropAddress, setDropAddress] = React.useState("Doorstep Delivery (Hotel / Home)");
  const [pickupDateTime, setPickupDateTime] = React.useState(defaultDateTimeStr(24));
  const [dropDateTime, setDropDateTime] = React.useState(defaultDateTimeStr(48));

  const pickupDisplay = formatDisplayDateTime(pickupDateTime);
  const dropDisplay = formatDisplayDateTime(dropDateTime);

  // Hidden datetime inputs refs for triggering native date picker
  const pickupRef = React.useRef<HTMLInputElement>(null);
  const dropRef = React.useRef<HTMLInputElement>(null);
  const pickupTimeRef = React.useRef<HTMLInputElement>(null);
  const dropTimeRef = React.useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (locationId) params.set("locationId", locationId);
    if (pickupDateTime) params.set("pickupDate", new Date(pickupDateTime).toISOString());
    if (dropDateTime) params.set("dropDate", new Date(dropDateTime).toISOString());
    if (mode === "chauffeur" && dropAddress.trim()) params.set("dropAddress", dropAddress.trim());

    router.push(mode === "self-drive" ? `/cars?${params}` : `/car-rental?${params}`);
  }

  const selectedLocation = locations.find((l) => l.id === locationId);

  return (
    <div className="relative z-20 mx-auto w-full max-w-7xl rounded-2xl border border-white/10 bg-neutral-950/95 shadow-2xl backdrop-blur">
      {/* Top bar: tabs + hint */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex w-fit rounded-full bg-white/5 p-1">
          {services.cars && (
            <button
              type="button"
              id="booking-widget-tab-self-drive"
              onClick={() => setMode("self-drive")}
              className={`rounded-full px-5 py-2 text-xs font-bold tracking-wide transition-all ${
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
              className={`rounded-full px-5 py-2 text-xs font-bold tracking-wide transition-all ${
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

      {/* Form fields */}
      <form onSubmit={handleSearch} className="px-5 pb-4">
        <div
          className={`grid items-end gap-3 ${mode === "chauffeur"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.1fr_1.1fr_2fr_auto]"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_2fr_auto]"
            }`}
        >
          {/* Pickup Location */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
              Pickup Location
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-orange-500" />
              <select
                id="booking-widget-pickup-location"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white outline-none focus:border-orange-500/50 focus:bg-white/8 cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-neutral-900 text-white">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drop Location — only in Chauffeur mode */}
          {mode === "chauffeur" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                Drop Location
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-orange-400" />
                <input
                  id="booking-widget-drop-address"
                  type="text"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="Doorstep Delivery (Hotel / Home)"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-orange-500/50"
                />
              </div>
            </div>
          )}

          {/* Unified Trip Schedule Date & Time Picker */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">
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
              maxDays={10}
              rentalMode={mode === "chauffeur" ? "HOURLY" : "DAILY"}
              compact
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            id="booking-widget-search-btn"
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 active:scale-95"
          >
            <Search className="size-4" />
            {mode === "self-drive" ? "SEARCH CARS" : "FIND TAXI"}
          </button>
        </div>
      </form>

      {/* Trust badges strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/5 px-5 py-3">
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
            <span className="text-white/30">(Pan-Rajasthan Helpline)</span>
          </span>
        </span>
      </div>
    </div>
  );
}
