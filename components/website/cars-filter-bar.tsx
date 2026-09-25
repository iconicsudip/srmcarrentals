"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TripSchedulePicker } from "@/components/website/datetime-picker";

interface FilterOption {
  slug?: string;
  id?: string;
  name: string;
}

interface LocationOption {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

interface CarsFilterBarProps {
  categories: FilterOption[];
  brands: FilterOption[];
  carTypes: FilterOption[];
  transmissionTypes: FilterOption[];
  fuelTypes: FilterOption[];
  locations?: LocationOption[];
  total: number;
}

const ALL = "all";

// ─── Custom DateTime Helpers & Picker (Matches Booking Engine) ───────────────

function defaultDateTime(hoursFromNow: number): string {
  const d = new Date(Date.now() + hoursFromNow * 3_600_000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

function calculateDuration(pickupDT: string, dropDT: string): { label: string; isValid: boolean; days: number; hours: number } {
  const start = new Date(pickupDT).getTime();
  const end = new Date(dropDT).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) {
    return { label: "Invalid duration", isValid: false, days: 0, hours: 0 };
  }
  const totalHours = Math.ceil((end - start) / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;

  if (days === 0) {
    return { label: `${totalHours} hr${totalHours > 1 ? "s" : ""}`, isValid: true, days: 0, hours: totalHours };
  }
  if (remHours === 0) {
    return { label: `${days} day${days > 1 ? "s" : ""} (${totalHours} hrs)`, isValid: true, days, hours: totalHours };
  }
  return { label: `${days}d ${remHours}h (${totalHours} hrs)`, isValid: true, days, hours: totalHours };
}

function formatChipDates(pickupDT: string, dropDT: string): string {
  try {
    const s = new Date(pickupDT);
    const e = new Date(dropDT);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sStr = `${s.getDate()} ${months[s.getMonth()]}`;
    const eStr = `${e.getDate()} ${months[e.getMonth()]}`;
    const dur = calculateDuration(pickupDT, dropDT);
    return `${sStr} – ${eStr}${dur.isValid && dur.days > 0 ? ` (${dur.days}d)` : ""}`;
  } catch {
    return "";
  }
}

// ─── Collapsible Filter Section ──────────────────────────────────────────────

function FilterSection({
  title,
  children,
  defaultOpen = true,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-white/8 pb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-1 text-[10px] font-bold tracking-widest text-white/50 uppercase hover:text-white transition"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-3 flex flex-col gap-1.5">{children}</div>}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all ${
        active
          ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
          : "border border-white/8 bg-white/[0.04] text-white/55 hover:border-white/20 hover:text-white"
      }`}
    >
      {active && <span className="size-1.5 shrink-0 rounded-full bg-orange-400" />}
      {children}
    </button>
  );
}

// ─── Main CarsFilterBar Component ───────────────────────────────────────────

export function CarsFilterBar({
  categories,
  brands,
  carTypes,
  transmissionTypes,
  fuelTypes,
  locations = [],
  total,
}: CarsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory  = searchParams.get("category") ?? "";
  const currentBrand     = searchParams.get("brand") ?? "";
  const currentType      = searchParams.get("type") ?? "";
  const currentTx        = searchParams.get("transmission") ?? "";
  const currentFuel      = searchParams.get("fuel") ?? "";
  const currentSearch    = searchParams.get("search") ?? "";
  const currentSort      = searchParams.get("sort") ?? "featured";
  const currentLocationId = searchParams.get("locationId") ?? searchParams.get("location") ?? "";
  const currentPickupDate = searchParams.get("pickupDate") ?? "";
  const currentDropDate   = searchParams.get("dropDate") ?? "";

  const [searchInput, setSearchInput] = React.useState(currentSearch);

  // Local draft state for pickup and drop datetime pickers
  const [pickupValue, setPickupValue] = React.useState(() => currentPickupDate || defaultDateTime(24));
  const [dropValue, setDropValue]     = React.useState(() => currentDropDate || defaultDateTime(48));

  // Sync state if URL changes externally
  React.useEffect(() => {
    if (currentPickupDate) setPickupValue(currentPickupDate);
    if (currentDropDate) setDropValue(currentDropDate);
  }, [currentPickupDate, currentDropDate]);

  const duration = calculateDuration(pickupValue, dropValue);
  const datesChangedFromUrl =
    pickupValue !== currentPickupDate || dropValue !== currentDropDate;

  // Build chip list from active filters
  const activeChips: { label: string; key: string }[] = [];

  if (currentLocationId) {
    const loc = locations.find((l) => l.id === currentLocationId);
    activeChips.push({ label: `📍 ${loc?.name ?? "Selected Location"}`, key: "location" });
  }

  if (currentPickupDate && currentDropDate) {
    const dateLabel = formatChipDates(currentPickupDate, currentDropDate);
    if (dateLabel) {
      activeChips.push({ label: `🗓️ ${dateLabel}`, key: "dates" });
    }
  }

  if (currentSearch)    activeChips.push({ label: `"${currentSearch}"`, key: "search" });
  if (currentCategory)  activeChips.push({ label: categories.find(c => (c.slug ?? c.id) === currentCategory)?.name ?? currentCategory, key: "category" });
  if (currentBrand)     activeChips.push({ label: brands.find(b => (b.slug ?? b.id) === currentBrand)?.name ?? currentBrand, key: "brand" });
  if (currentType)      activeChips.push({ label: carTypes.find(t => (t.slug ?? t.id) === currentType)?.name ?? currentType, key: "type" });
  if (currentTx)        activeChips.push({ label: transmissionTypes.find(t => t.id === currentTx)?.name ?? currentTx, key: "transmission" });
  if (currentFuel)      activeChips.push({ label: fuelTypes.find(f => f.id === currentFuel)?.name ?? currentFuel, key: "fuel" });

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL || !value) {
      params.delete(key);
      if (key === "locationId") params.delete("location");
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleApplyDates() {
    if (!duration.isValid) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("pickupDate", pickupValue);
    params.set("dropDate", dropValue);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleClearDates() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pickupDate");
    params.delete("dropDate");
    params.delete("page");
    setPickupValue(defaultDateTime(24));
    setDropValue(defaultDateTime(48));
    router.push(`${pathname}?${params.toString()}`);
  }

  function removeChip(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "dates") {
      params.delete("pickupDate");
      params.delete("dropDate");
      setPickupValue(defaultDateTime(24));
      setDropValue(defaultDateTime(48));
    } else if (key === "location") {
      params.delete("locationId");
      params.delete("location");
    } else {
      params.delete(key);
      if (key === "search") setSearchInput("");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
    setSearchInput("");
    setPickupValue(defaultDateTime(24));
    setDropValue(defaultDateTime(48));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("search", searchInput);
  }

  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-neutral-900 p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(249,115,22,0.3)_transparent]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-orange-500" />
          <span className="text-sm font-black text-white">Filters</span>
        </div>
        {activeChips.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-[10px] font-semibold text-orange-400 hover:text-orange-300 transition"
          >
            <RotateCcw className="size-3" /> Clear All
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/15 px-2.5 py-1 text-[11px] font-semibold text-orange-400"
            >
              <span className="max-w-[190px] truncate">{chip.label}</span>
              <button
                type="button"
                onClick={() => removeChip(chip.key)}
                className="flex items-center text-orange-400/60 hover:text-orange-300 transition shrink-0"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Results + Sort */}
      <div className="flex flex-col gap-2 rounded-xl border border-white/8 bg-black/30 p-3">
        <span className="text-xs text-white/45">
          <span className="font-bold text-white">{total}</span> cars found
        </span>
        <Select value={currentSort} onValueChange={(v) => updateParam("sort", v)}>
          <SelectTrigger className="h-8 w-full border-white/10 bg-black/40 text-xs text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Recommended</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/30" />
        <input
          type="text"
          placeholder="Search by name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-8 pr-8 text-xs text-white outline-none placeholder:text-white/30 focus:border-orange-500 transition"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); updateParam("search", ""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      {/* ─── TRIP SCHEDULE & LOCATION (BOOKING ENGINE CONTROLS) ─── */}
      <div className="rounded-xl border border-orange-500/25 bg-gradient-to-b from-orange-500/[0.08] to-transparent p-3.5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest text-orange-400 uppercase flex items-center gap-1.5">
            <Sparkles className="size-3 text-orange-400" />
            Trip & Location
          </span>
          {Boolean(currentPickupDate || currentDropDate || currentLocationId) && (
            <button
              type="button"
              onClick={() => {
                if (currentPickupDate || currentDropDate) handleClearDates();
                if (currentLocationId) updateParam("locationId", ALL);
              }}
              className="text-[10px] font-semibold text-white/40 hover:text-orange-400 transition"
            >
              Reset
            </button>
          )}
        </div>

        {/* Pickup & Return Location */}
        {locations.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-white/50 uppercase flex items-center gap-1.5">
              <MapPin className="size-3 text-orange-400" />
              Pickup & Return Location
            </label>
            <div className="relative">
              <select
                value={currentLocationId || ALL}
                onChange={(e) => updateParam("locationId", e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/10 bg-black/50 py-2.5 pl-3 pr-8 text-xs text-white outline-none focus:border-orange-500 transition cursor-pointer"
              >
                <option value={ALL} className="bg-neutral-900 text-white">
                  All Locations (Any Branch)
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-neutral-900 text-white">
                    {loc.name} {loc.city ? `(${loc.city})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-white/40" />
            </div>
          </div>
        )}

        {/* Unified Trip Schedule Picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-wider text-white/50 uppercase flex items-center gap-1.5">
            <Calendar className="size-3 text-orange-400" />
            Trip Dates & Times
          </span>
          <TripSchedulePicker
            pickup={pickupValue}
            drop={dropValue}
            minHours={24}
            maxDays={10}
            compact
            onChange={({ pickup, drop }) => {
              setPickupValue(pickup);
              setDropValue(drop);
            }}
          />
        </div>

        {/* Apply Schedule Button */}
        {datesChangedFromUrl ? (
          <button
            type="button"
            onClick={handleApplyDates}
            disabled={!duration.isValid}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition active:scale-[0.98]"
          >
            <Check className="size-3.5" />
            Apply Trip Dates
          </button>
        ) : currentPickupDate && currentDropDate ? (
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold px-1">
            <span className="flex items-center gap-1">
              <Check className="size-3" /> Schedule Active
            </span>
            <button
              type="button"
              onClick={handleClearDates}
              className="text-white/40 hover:text-white transition text-[10px]"
            >
              Clear
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleApplyDates}
            disabled={!duration.isValid}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/15 py-2 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-white disabled:opacity-50 transition"
          >
            Apply Schedule
          </button>
        )}
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <FilterSection title="Category">
          <FilterPill active={!currentCategory} onClick={() => updateParam("category", ALL)}>
            All Categories
          </FilterPill>
          {categories.map((c) => (
            <FilterPill
              key={c.slug ?? c.id}
              active={currentCategory === (c.slug ?? c.id)}
              onClick={() => updateParam("category", (c.slug ?? c.id) as string)}
            >
              {c.name}
            </FilterPill>
          ))}
        </FilterSection>
      )}

      {/* Brand */}
      {brands.length > 0 && (
        <FilterSection title="Brand">
          <FilterPill active={!currentBrand} onClick={() => updateParam("brand", ALL)}>
            All Brands
          </FilterPill>
          {brands.map((b) => (
            <FilterPill
              key={b.slug ?? b.id}
              active={currentBrand === (b.slug ?? b.id)}
              onClick={() => updateParam("brand", (b.slug ?? b.id) as string)}
            >
              {b.name}
            </FilterPill>
          ))}
        </FilterSection>
      )}

      {/* Car Type */}
      {carTypes.length > 0 && (
        <FilterSection title="Car Type" defaultOpen={false}>
          <FilterPill active={!currentType} onClick={() => updateParam("type", ALL)}>
            All Types
          </FilterPill>
          {carTypes.map((t) => (
            <FilterPill
              key={t.slug ?? t.id}
              active={currentType === (t.slug ?? t.id)}
              onClick={() => updateParam("type", (t.slug ?? t.id) as string)}
            >
              {t.name}
            </FilterPill>
          ))}
        </FilterSection>
      )}

      {/* Transmission */}
      {transmissionTypes.length > 0 && (
        <FilterSection title="Transmission" defaultOpen={false}>
          <FilterPill active={!currentTx} onClick={() => updateParam("transmission", ALL)}>
            Any
          </FilterPill>
          {transmissionTypes.map((t) => (
            <FilterPill
              key={t.id}
              active={currentTx === t.id}
              onClick={() => updateParam("transmission", t.id as string)}
            >
              {t.name}
            </FilterPill>
          ))}
        </FilterSection>
      )}

      {/* Fuel Type */}
      {fuelTypes.length > 0 && (
        <FilterSection title="Fuel Type" defaultOpen={false}>
          <FilterPill active={!currentFuel} onClick={() => updateParam("fuel", ALL)}>
            Any
          </FilterPill>
          {fuelTypes.map((f) => (
            <FilterPill
              key={f.id}
              active={currentFuel === f.id}
              onClick={() => updateParam("fuel", f.id as string)}
            >
              {f.name}
            </FilterPill>
          ))}
        </FilterSection>
      )}
    </aside>
  );
}

