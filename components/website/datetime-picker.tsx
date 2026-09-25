"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import type { DateBefore, DateAfter, DateRange } from "react-day-picker";
import { format, parse, isValid, isSameDay, addDays, addMinutes, differenceInMinutes } from "date-fns";
import { ArrowRight, Calendar, Check, ChevronLeft, ChevronRight, Clock, Sparkles, X } from "lucide-react";
import { Label } from "@/components/ui/label";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Parse "YYYY-MM-DDTHH:mm" → { date, h24, minute } */
function parseISO(value: string): { date: Date | undefined; h24: number; minute: string } {
  const [datePart = "", timePart = "00:00"] = value.split("T");
  const [hStr = "09", mStr = "00"] = timePart.split(":");
  const h24 = parseInt(hStr, 10);
  const date = datePart ? parse(datePart, "yyyy-MM-dd", new Date()) : undefined;
  return {
    date: date && isValid(date) ? date : undefined,
    h24: isNaN(h24) ? 9 : h24,
    minute: mStr.padStart(2, "0"),
  };
}

/** Build "YYYY-MM-DDTHH:mm" from parts */
function buildISO(date: Date | undefined, h24: number, minute: string): string {
  if (!date || !isValid(date)) return "";
  return `${format(date, "yyyy-MM-dd")}T${String(h24).padStart(2, "0")}:${minute}`;
}

/** Convert 12-hour display → 24-hour */
function h12ToH24(h12: string, period: "AM" | "PM"): number {
  let h = parseInt(h12, 10);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return h;
}

/** Convert 24-hour → 12-hour display */
function h24ToDisplay(h24: number): { hour12: string; period: "AM" | "PM" } {
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const raw = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return { hour12: String(raw).padStart(2, "0"), period };
}

/** Snap a Date to the next N-minute boundary */
function snapToNextQuarter(d: Date): Date {
  const mins = d.getMinutes();
  const snapped = Math.ceil(mins / 15) * 15;
  const result = new Date(d);
  if (snapped >= 60) {
    result.setHours(d.getHours() + 1, 0, 0, 0);
  } else {
    result.setMinutes(snapped, 0, 0);
  }
  return result;
}

const ALL_HOUR12 = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const ALL_MINUTES = ["00", "15", "30", "45"];

// ─── Compute valid hours & minutes for a given date vs minDT ─────────────────

function validHoursForPeriod(
  selectedDate: Date | undefined,
  period: "AM" | "PM",
  minDT: Date | undefined,
): string[] {
  if (!selectedDate || !minDT || !isSameDay(selectedDate, minDT)) return ALL_HOUR12;
  const minH24 = minDT.getHours();
  return ALL_HOUR12.filter((h12) => h12ToH24(h12, period) >= minH24);
}

function validMinutes(
  selectedDate: Date | undefined,
  h24: number,
  minDT: Date | undefined,
): string[] {
  if (!selectedDate || !minDT || !isSameDay(selectedDate, minDT)) return ALL_MINUTES;
  const minH24 = minDT.getHours();
  const minMin = minDT.getMinutes();
  if (h24 > minH24) return ALL_MINUTES;
  if (h24 < minH24) return [];
  return ALL_MINUTES.filter((m) => parseInt(m, 10) >= minMin);
}

/** Clamp a datetime to be >= minDT, snapping to next valid 15-min slot */
function clampToMin(h24: number, minute: string, minDT: Date): { h24: number; minute: string } {
  const minH24 = minDT.getHours();
  const minMin = minDT.getMinutes();
  // snap to next quarter >= minDT minutes
  const snapped = snapToNextQuarter(minDT);
  const snapH24 = snapped.getHours();
  const snapMin = String(snapped.getMinutes()).padStart(2, "0");

  if (h24 < minH24 || (h24 === minH24 && parseInt(minute, 10) < minMin)) {
    return { h24: snapH24, minute: snapMin };
  }
  // minute might not be on a 15-boundary valid slot
  const vMins = ALL_MINUTES.filter((m) => {
    if (h24 > minH24) return true;
    return parseInt(m, 10) >= minMin;
  });
  if (!vMins.includes(minute)) {
    const first = vMins[0] ?? snapMin;
    return { h24, minute: first };
  }
  return { h24, minute };
}

// ─── TimeSelector sub-component ───────────────────────────────────────────────

interface TimeSelectorProps {
  hour12: string;
  minute: string;
  period: "AM" | "PM";
  availHours: string[];
  availMinutes: string[];
  onChange: (hour12: string, minute: string, period: "AM" | "PM") => void;
}

function TimeSelector({ hour12, minute, period, availHours, availMinutes, onChange }: TimeSelectorProps) {
  const cls =
    "rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-white outline-none focus:border-orange-500 appearance-none cursor-pointer hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed";

  const amHours = validHoursForPeriod(undefined, "AM", undefined); // always all for label purposes
  const pmHours = validHoursForPeriod(undefined, "PM", undefined);

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/8">
      <Clock className="size-3.5 shrink-0 text-orange-400" />
      <div className="flex items-center gap-1.5 flex-1 flex-wrap">
        {/* Hour */}
        <select
          value={availHours.includes(hour12) ? hour12 : availHours[0] ?? hour12}
          onChange={(e) => onChange(e.target.value, minute, period)}
          className={cls}
          aria-label="Hour"
        >
          {availHours.map((h) => (
            <option key={h} value={h} className="bg-neutral-900">{h}</option>
          ))}
        </select>
        <span className="text-white/40 text-xs font-bold">:</span>
        {/* Minute */}
        <select
          value={availMinutes.includes(minute) ? minute : availMinutes[0] ?? minute}
          onChange={(e) => onChange(hour12, e.target.value, period)}
          className={cls}
          aria-label="Minute"
          disabled={availMinutes.length === 0}
        >
          {availMinutes.map((m) => (
            <option key={m} value={m} className="bg-neutral-900">{m}</option>
          ))}
        </select>
        {/* AM / PM */}
        <select
          value={period}
          onChange={(e) => onChange(hour12, minute, e.target.value as "AM" | "PM")}
          className={`${cls} font-bold text-orange-400 ml-1`}
          aria-label="AM/PM"
        >
          <option value="AM" className="bg-neutral-900">AM</option>
          <option value="PM" className="bg-neutral-900">PM</option>
        </select>
      </div>
    </div>
  );
}

// ─── Main DateTimePicker ──────────────────────────────────────────────────────

export interface DateTimePickerProps {
  label: string;
  /** Controlled value: "YYYY-MM-DDTHH:mm" */
  value: string;
  onChange: (v: string) => void;
  /** Minimum selectable datetime — disables past dates AND past times */
  minDateTime?: string; // "YYYY-MM-DDTHH:mm"
  /** Maximum selectable date (inclusive) */
  maxDate?: string; // "YYYY-MM-DD"
}

export function DateTimePicker({ label, value, onChange, minDateTime, maxDate }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { date, h24, minute } = parseISO(value);
  const { hour12, period } = h24ToDisplay(h24);

  // Parse constraints
  const minDT = React.useMemo<Date | undefined>(() => {
    if (!minDateTime) return undefined;
    const d = new Date(minDateTime.replace("T", " ").length === 16
      ? `${minDateTime}:00`
      : minDateTime);
    // fallback parse
    const d2 = parse(minDateTime.slice(0, 16), "yyyy-MM-dd'T'HH:mm", new Date());
    const result = isValid(d) ? d : isValid(d2) ? d2 : undefined;
    return result;
  }, [minDateTime]);

  const maxDateObj = React.useMemo<Date | undefined>(() => {
    if (!maxDate) return undefined;
    const d = parse(maxDate, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  }, [maxDate]);

  // Available hours/minutes for the selected date
  const availHours = validHoursForPeriod(date, period as "AM" | "PM", minDT);
  const currentH24 = h24;
  const availMins = validMinutes(date, currentH24, minDT);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // When user selects a day, snap time to valid slot if needed
  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    let finalH24 = h24;
    let finalMin = minute;

    if (minDT && isSameDay(day, minDT)) {
      const clamped = clampToMin(h24, minute, minDT);
      finalH24 = clamped.h24;
      finalMin = clamped.minute;
    }
    onChange(buildISO(day, finalH24, finalMin));
    // Don't close — let user pick time
  };

  const handleTimeChange = (newH12: string, newMin: string, newPeriod: "AM" | "PM") => {
    let newH24 = h12ToH24(newH12, newPeriod);
    let finalMin = newMin;

    // Snap to valid slot if on min-date
    if (date && minDT && isSameDay(date, minDT)) {
      const clamped = clampToMin(newH24, newMin, minDT);
      newH24 = clamped.h24;
      finalMin = clamped.minute;
    }
    onChange(buildISO(date, newH24, finalMin));
  };

  // Disabled days for DayPicker
  const disabled: (DateBefore | DateAfter)[] = [];
  if (minDT) {
    const minDay = new Date(minDT);
    minDay.setHours(0, 0, 0, 0);
    disabled.push({ before: minDay });
  }
  if (maxDateObj) {
    disabled.push({ after: maxDateObj });
  }

  const displayValue =
    date && isValid(date)
      ? `${format(date, "EEE, d MMM yyyy")}  •  ${hour12}:${minute} ${period}`
      : "Select date & time";

  return (
    <div className="relative flex flex-col gap-1.5" ref={containerRef}>
      <Label className="text-xs font-semibold text-white/55">{label}</Label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2.5 w-full rounded-xl border px-3 py-2.5 text-left text-xs transition ${
          open
            ? "border-orange-500 bg-orange-500/8 shadow-lg shadow-orange-500/10"
            : "border-white/10 bg-black/40 hover:border-white/20"
        }`}
      >
        <Calendar className="size-3.5 shrink-0 text-orange-400" />
        <span className={date && isValid(date) ? "text-white font-medium" : "text-white/40"}>
          {displayValue}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 rounded-2xl border border-white/12 bg-neutral-950/98 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={handleDaySelect}
            disabled={disabled.length > 0 ? disabled : undefined}
            showOutsideDays={false}
            className="p-3"
            classNames={{
              months: "flex flex-col",
              month: "space-y-2",
              month_caption: "flex items-center justify-between px-1 py-1",
              caption_label: "text-sm font-black text-white uppercase tracking-wide",
              nav: "flex items-center gap-1",
              button_previous:
                "inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/15 hover:text-white transition",
              button_next:
                "inline-flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/15 hover:text-white transition",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday: "flex-1 text-center text-[10px] font-bold text-white/30 pb-1",
              week: "flex mt-1",
              day: "flex-1 relative",
              day_button:
                "w-full h-8 text-xs rounded-lg font-medium text-white/70 hover:bg-white/10 hover:text-white transition flex items-center justify-center",
              selected: "bg-orange-500 text-white rounded-lg font-bold",
              today: "text-orange-400 font-bold",
              outside: "text-white/20",
              disabled: "opacity-20 cursor-not-allowed pointer-events-none",
              hidden: "invisible",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <ChevronLeft className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                ),
            }}
          />

          <TimeSelector
            hour12={availHours.includes(hour12) ? hour12 : (availHours[0] ?? hour12)}
            minute={availMins.includes(minute) ? minute : (availMins[0] ?? minute)}
            period={period as "AM" | "PM"}
            availHours={availHours}
            availMinutes={availMins.length > 0 ? availMins : ALL_MINUTES}
            onChange={handleTimeChange}
          />

          {/* Constraint hint */}
          {(minDT || maxDateObj) && (
            <div className="px-3 pt-1 text-[10px] text-white/35 text-center">
              {minDT && maxDateObj
                ? `From ${format(minDT, "d MMM, h:mm a")} · max ${maxDate ? format(maxDateObj, "d MMM") : ""}`
                : minDT
                  ? `Earliest: ${format(minDT, "d MMM, h:mm a")}`
                  : maxDateObj
                    ? `Latest: ${format(maxDateObj, "d MMM yyyy")}`
                    : null}
            </div>
          )}

          <div className="px-3 py-2.5 border-t border-white/8 mt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 py-2 text-xs font-black text-white transition active:scale-95"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UNIFIED TRIP SCHEDULE PICKER (Single Date & Time Range Picker) ─────────────

export interface TripSchedulePickerProps {
  /** Pickup ISO string: "YYYY-MM-DDTHH:mm" */
  pickup: string;
  /** Drop ISO string: "YYYY-MM-DDTHH:mm" */
  drop: string;
  /** Callback returning the updated schedule */
  onChange: (schedule: { pickup: string; drop: string }) => void;
  /** Earliest pickup datetime allowed (e.g. now + 15 min) */
  minDateTime?: string;
  /** Minimum hours between pickup & drop (default: 24 for daily, 1 for hourly) */
  minHours?: number;
  /** Maximum rental duration in days (default: 10) */
  maxDays?: number;
  /** Rental mode */
  rentalMode?: "DAILY" | "HOURLY";
  /** Optional custom title */
  label?: string;
  /** Compact 1-line style for search bar / filter sidebar */
  compact?: boolean;
  className?: string;
}

export function TripSchedulePicker({
  pickup,
  drop,
  onChange,
  minDateTime,
  minHours = 24,
  maxDays = 10,
  rentalMode = "DAILY",
  label,
  compact = false,
  className = "",
}: TripSchedulePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scrolling when picker modal is open
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Parse current values
  const { date: pickupDate, h24: pickupH24, minute: pickupMin } = parseISO(pickup);
  const { date: dropDate, h24: dropH24, minute: dropMin } = parseISO(drop);

  // Draft local state while the popover is open
  const [draftFrom, setDraftFrom] = React.useState<Date | undefined>(pickupDate);
  const [draftTo, setDraftTo] = React.useState<Date | undefined>(dropDate);
  const [draftPickupH24, setDraftPickupH24] = React.useState<number>(pickupH24);
  const [draftPickupMin, setDraftPickupMin] = React.useState<string>(pickupMin);
  const [draftDropH24, setDraftDropH24] = React.useState<number>(dropH24);
  const [draftDropMin, setDraftDropMin] = React.useState<string>(dropMin);

  // Sync draft state whenever popover opens or props change
  React.useEffect(() => {
    if (open) {
      const p = parseISO(pickup);
      const d = parseISO(drop);
      setDraftFrom(p.date);
      setDraftPickupH24(p.h24);
      setDraftPickupMin(p.minute);
      setDraftTo(d.date);
      setDraftDropH24(d.h24);
      setDraftDropMin(d.minute);
    }
  }, [open, pickup, drop]);

  // Minimum allowed datetime (today or now snapped)
  const minDT = React.useMemo<Date>(() => {
    if (minDateTime) {
      const d = new Date(minDateTime.length === 16 ? `${minDateTime}:00` : minDateTime);
      if (isValid(d)) return d;
    }
    return new Date();
  }, [minDateTime]);

  // Maximum allowed date relative to draftFrom (pickup + maxDays)
  const maxDropDate = React.useMemo<Date | undefined>(() => {
    if (!draftFrom) return undefined;
    return addDays(draftFrom, maxDays);
  }, [draftFrom, maxDays]);

  // Disabled dates for DayPicker
  const disabledDates = React.useMemo<(DateBefore | DateAfter)[]>(() => {
    const minDay = new Date(minDT);
    minDay.setHours(0, 0, 0, 0);
    const rules: (DateBefore | DateAfter)[] = [{ before: minDay }];
    if (maxDropDate) {
      rules.push({ after: maxDropDate });
    }
    return rules;
  }, [minDT, maxDropDate]);


  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Compute live duration
  const draftPickupFull = React.useMemo(() => {
    if (!draftFrom || !isValid(draftFrom)) return undefined;
    const d = new Date(draftFrom);
    d.setHours(draftPickupH24, parseInt(draftPickupMin, 10), 0, 0);
    return d;
  }, [draftFrom, draftPickupH24, draftPickupMin]);

  const draftDropFull = React.useMemo(() => {
    if (!draftTo || !isValid(draftTo)) return undefined;
    const d = new Date(draftTo);
    d.setHours(draftDropH24, parseInt(draftDropMin, 10), 0, 0);
    return d;
  }, [draftTo, draftDropH24, draftDropMin]);

  const durationMins = React.useMemo(() => {
    if (!draftPickupFull || !draftDropFull) return 0;
    return differenceInMinutes(draftDropFull, draftPickupFull);
  }, [draftPickupFull, draftDropFull]);

  const totalHours = Math.round(durationMins / 60);
  const totalDays = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;

  const durationLabel = React.useMemo(() => {
    if (totalHours <= 0) return "Invalid range";
    if (totalDays > 0) {
      return remHours > 0 ? `${totalDays}d ${remHours}h (${totalHours} hrs)` : `${totalDays} Day${totalDays > 1 ? "s" : ""} (${totalHours} hrs)`;
    }
    return `${totalHours} Hour${totalHours > 1 ? "s" : ""}`;
  }, [totalHours, totalDays, remHours]);

  const isTooShort = totalHours < minHours;
  const isTooLong = totalHours > maxDays * 24;
  const isValidSchedule = !isTooShort && !isTooLong && totalHours > 0;

  // Handle Date Range Selection
  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) return;
    if (range.from) {
      setDraftFrom(range.from);
      if (range.to) {
        const maxLimit = addDays(range.from, maxDays);
        setDraftTo(range.to > maxLimit ? maxLimit : range.to);
      } else {
        // If single day clicked, default drop to + 1 day
        setDraftTo(addDays(range.from, rentalMode === "HOURLY" ? 0 : 1));
      }
    }
  };

  // Quick Preset Handlers
  const applyPresetDays = (days: number) => {
    if (!draftFrom) return;
    const clamped = Math.min(days, maxDays);
    setDraftTo(addDays(draftFrom, clamped));
    setDraftDropH24(draftPickupH24);
    setDraftDropMin(draftPickupMin);
  };

  const applyPresetHours = (hours: number) => {
    if (!draftFrom) return;
    const end = new Date(draftFrom);
    end.setHours(draftPickupH24 + hours, parseInt(draftPickupMin, 10));
    setDraftTo(end);
    setDraftDropH24(end.getHours());
    setDraftDropMin(String(end.getMinutes()).padStart(2, "0"));
  };

  // Time conversion helpers for display
  const { hour12: pickupH12, period: pickupPeriod } = h24ToDisplay(draftPickupH24);
  const { hour12: dropH12, period: dropPeriod } = h24ToDisplay(draftDropH24);

  const availPickupHours = validHoursForPeriod(draftFrom, pickupPeriod, minDT);
  const availPickupMins = validMinutes(draftFrom, draftPickupH24, minDT);

  const availDropHours = validHoursForPeriod(draftTo, dropPeriod, undefined);
  const availDropMins = validMinutes(draftTo, draftDropH24, undefined);

  // Trigger displays
  const pickupDispDate = pickupDate && isValid(pickupDate) ? format(pickupDate, "EEE, d MMM") : "Select Pickup";
  const pickupDispTime = h24ToDisplay(pickupH24).hour12 + ":" + pickupMin + " " + h24ToDisplay(pickupH24).period;

  const dropDispDate = dropDate && isValid(dropDate) ? format(dropDate, "EEE, d MMM") : "Select Drop";
  const dropDispTime = h24ToDisplay(dropH24).hour12 + ":" + dropMin + " " + h24ToDisplay(dropH24).period;

  // Confirm and save
  const handleConfirm = () => {
    if (!isValidSchedule || !draftFrom || !draftTo) return;
    const newPickup = buildISO(draftFrom, draftPickupH24, draftPickupMin);
    const newDrop = buildISO(draftTo, draftDropH24, draftDropMin);
    onChange({ pickup: newPickup, drop: newDrop });
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── TRIGGER ── */}
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-all ${
            open
              ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/15"
              : "border-white/10 bg-black/50 hover:border-white/20 hover:bg-white/5"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="size-4 shrink-0 text-orange-400" />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">
                {pickupDispDate} ({pickupDispTime}) → {dropDispDate} ({dropDispTime})
              </div>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-400">
            {durationLabel}
          </span>
        </button>
      ) : (
        <div
          onClick={() => setOpen((o) => !o)}
          className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
            open
              ? "border-orange-500 bg-orange-500/10 shadow-xl shadow-orange-500/10"
              : "border-white/10 bg-neutral-900/80 hover:border-orange-500/40 hover:bg-neutral-900"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                <Calendar className="size-3.5" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-white">
                {label ?? (rentalMode === "HOURLY" ? "Hourly Rental Schedule" : "24h Daily Trip Schedule")}
              </span>
            </div>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-bold text-orange-400">
              {durationLabel}
            </span>
          </div>

          {/* Dual Date Strip */}
          <div className="mt-3.5 grid grid-cols-2 gap-3 divide-x divide-white/8">
            {/* Pickup */}
            <div>
              <span className="text-[10px] font-bold tracking-widest text-orange-400 uppercase">
                Pickup Schedule
              </span>
              <div className="mt-1 text-sm font-black text-white">{pickupDispDate}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/60">
                <Clock className="size-3 text-orange-400" />
                <span>{pickupDispTime}</span>
              </div>
            </div>

            {/* Drop */}
            <div className="pl-3">
              <span className="text-[10px] font-bold tracking-widest text-orange-400 uppercase">
                Drop-off Schedule
              </span>
              <div className="mt-1 text-sm font-black text-white">{dropDispDate}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/60">
                <Clock className="size-3 text-orange-400" />
                <span>{dropDispTime}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-2.5 text-[10px] text-white/40">
            <span>
              {rentalMode === "HOURLY" ? "Flexible hourly package" : "Min 24 hrs • Max 10 days"}
            </span>
            <span className="flex items-center gap-1 font-semibold text-orange-400 group-hover:text-orange-300">
              Change dates & times <ArrowRight className="size-3" />
            </span>
          </div>
        </div>
      )}

      {/* ── UNIFIED POPOVER / MODAL (PORTALED TO BODY) ── */}
      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          {/* Backdrop click to close */}
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-[420px] max-h-[90vh] flex flex-col rounded-3xl border border-white/20 bg-neutral-950 p-4 sm:p-5 shadow-2xl shadow-black/90 overflow-hidden">
            {/* Header (Always Visible) */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Calendar className="size-4 text-orange-400" />
                  Trip Dates &amp; Times
                </h3>
                <p className="text-[10px] text-white/50">
                  Select your pickup and return date on the calendar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-3 py-2.5">
              {/* Quick Duration Presets - Horizontal scrollable chip bar */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1.5">
                  Quick Trip Presets:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {rentalMode === "HOURLY" ? (
                    <>
                      {[4, 8, 12, 24].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => applyPresetHours(h)}
                          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400 transition"
                        >
                          {h === 24 ? "24h (1 Day)" : `${h} Hours`}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        { days: 1, label: "24h (1 Day)" },
                        { days: 2, label: "2 Days" },
                        { days: 3, label: "3 Days" },
                        { days: 5, label: "5 Days" },
                        { days: 7, label: "7 Days" },
                        { days: 10, label: "10 Days (Max)" },
                      ].map((item) => (
                        <button
                          key={item.days}
                          type="button"
                          onClick={() => applyPresetDays(item.days)}
                          className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                            item.days === 10
                              ? "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                              : "border-white/10 bg-white/5 text-white/80 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Interactive Range Calendar */}
              <div className="rounded-2xl border border-white/8 bg-black/40 p-2">
                <DayPicker
                  mode="range"
                  selected={{ from: draftFrom, to: draftTo }}
                  onSelect={handleRangeSelect}
                  disabled={disabledDates}
                  showOutsideDays={false}
                  className="p-0.5"
                  classNames={{
                    months: "flex flex-col",
                    month: "space-y-1.5",
                    month_caption: "flex items-center justify-between px-1 py-0.5",
                    caption_label: "text-xs font-black text-white uppercase tracking-wider",
                    nav: "flex items-center gap-1",
                    button_previous:
                      "inline-flex size-6 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/15 hover:text-white transition",
                    button_next:
                      "inline-flex size-6 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/15 hover:text-white transition",
                    month_grid: "w-full border-collapse",
                    weekdays: "flex",
                    weekday: "flex-1 text-center text-[10px] font-bold text-white/30 pb-1",
                    week: "flex mt-0.5",
                    day: "flex-1 relative p-0 text-center",
                    day_button:
                      "w-full h-7 text-xs font-medium text-white/70 hover:bg-white/15 hover:text-white transition flex items-center justify-center rounded-lg",
                    range_start: "bg-orange-500 text-white font-bold rounded-l-lg rounded-r-none",
                    range_middle: "bg-orange-500/20 text-orange-200 rounded-none",
                    range_end: "bg-orange-500 text-white font-bold rounded-r-lg rounded-l-none",
                    selected: "bg-orange-500 text-white font-bold",
                    today: "text-orange-400 font-bold",
                    outside: "text-white/20",
                    disabled: "opacity-20 cursor-not-allowed pointer-events-none",
                    hidden: "invisible",
                  }}
                  components={{
                    Chevron: ({ orientation }) =>
                      orientation === "left" ? (
                        <ChevronLeft className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      ),
                  }}
                />
              </div>

              {/* Time Selection Rows (Zero horizontal clipping, stacked for clean mobile and desktop fit) */}
              <div className="space-y-2 border-t border-white/10 pt-2.5">
                {/* Pickup Time */}
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Pickup Time
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={availPickupHours.includes(pickupH12) ? pickupH12 : availPickupHours[0] ?? pickupH12}
                      onChange={(e) => {
                        const h24 = h12ToH24(e.target.value, pickupPeriod);
                        setDraftPickupH24(h24);
                      }}
                      className="rounded-lg border border-white/15 bg-neutral-900 px-2 py-1 text-xs font-bold text-white outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {availPickupHours.map((h) => (
                        <option key={h} value={h} className="bg-neutral-900">{h}</option>
                      ))}
                    </select>
                    <span className="text-white/40 font-bold">:</span>
                    <select
                      value={availPickupMins.includes(draftPickupMin) ? draftPickupMin : availPickupMins[0] ?? draftPickupMin}
                      onChange={(e) => setDraftPickupMin(e.target.value)}
                      className="rounded-lg border border-white/15 bg-neutral-900 px-2 py-1 text-xs font-bold text-white outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {availPickupMins.map((m) => (
                        <option key={m} value={m} className="bg-neutral-900">{m}</option>
                      ))}
                    </select>
                    <div className="flex rounded-lg border border-white/15 bg-neutral-900 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const h24 = h12ToH24(pickupH12, "AM");
                          setDraftPickupH24(h24);
                        }}
                        className={`rounded px-1.5 py-0.5 text-[11px] font-black transition ${
                          pickupPeriod === "AM" ? "bg-orange-500 text-white" : "text-white/40 hover:text-white"
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const h24 = h12ToH24(pickupH12, "PM");
                          setDraftPickupH24(h24);
                        }}
                        className={`rounded px-1.5 py-0.5 text-[11px] font-black transition ${
                          pickupPeriod === "PM" ? "bg-orange-500 text-white" : "text-white/40 hover:text-white"
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>

                {/* Drop-off Time */}
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-orange-400" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      Drop-off Time
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={availDropHours.includes(dropH12) ? dropH12 : availDropHours[0] ?? dropH12}
                      onChange={(e) => {
                        const h24 = h12ToH24(e.target.value, dropPeriod);
                        setDraftDropH24(h24);
                      }}
                      className="rounded-lg border border-white/15 bg-neutral-900 px-2 py-1 text-xs font-bold text-white outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {availDropHours.map((h) => (
                        <option key={h} value={h} className="bg-neutral-900">{h}</option>
                      ))}
                    </select>
                    <span className="text-white/40 font-bold">:</span>
                    <select
                      value={availDropMins.includes(draftDropMin) ? draftDropMin : availDropMins[0] ?? draftDropMin}
                      onChange={(e) => setDraftDropMin(e.target.value)}
                      className="rounded-lg border border-white/15 bg-neutral-900 px-2 py-1 text-xs font-bold text-white outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {availDropMins.map((m) => (
                        <option key={m} value={m} className="bg-neutral-900">{m}</option>
                      ))}
                    </select>
                    <div className="flex rounded-lg border border-white/15 bg-neutral-900 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const h24 = h12ToH24(dropH12, "AM");
                          setDraftDropH24(h24);
                        }}
                        className={`rounded px-1.5 py-0.5 text-[11px] font-black transition ${
                          dropPeriod === "AM" ? "bg-orange-500 text-white" : "text-white/40 hover:text-white"
                        }`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const h24 = h12ToH24(dropH12, "PM");
                          setDraftDropH24(h24);
                        }}
                        className={`rounded px-1.5 py-0.5 text-[11px] font-black transition ${
                          dropPeriod === "PM" ? "bg-orange-500 text-white" : "text-white/40 hover:text-white"
                        }`}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer (Always visible without scrolling) */}
            <div className="mt-2 pt-2.5 border-t border-white/10 shrink-0 space-y-2">
              {/* Validation & Duration Status Bar */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-center text-xs">
                {isTooShort ? (
                  <span className="font-semibold text-amber-400 text-[11px]">
                    ⚠️ Minimum {minHours} hours required ({rentalMode === "HOURLY" ? "hourly rental" : "daily 24h formula"})
                  </span>
                ) : isTooLong ? (
                  <span className="font-semibold text-red-400 text-[11px]">
                    ⚠️ Maximum rental duration is {maxDays} days
                  </span>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60 text-[11px]">Selected Duration:</span>
                    <span className="font-black text-emerald-400 text-xs flex items-center gap-1">
                      {durationLabel} <Check className="size-3 text-emerald-400" />
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm & Cancel Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isValidSchedule}
                  onClick={handleConfirm}
                  className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/25 transition active:scale-95"
                >
                  Apply Schedule →
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
