"use client";

import * as React from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarDays, Search, X } from "lucide-react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLookupOptions } from "@/hooks/use-lookup-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface BookingFilterValues {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  carId: string;
  locationId: string;
  paymentStatus: string;
}

export const EMPTY_FILTERS: BookingFilterValues = { search: "", status: "ALL", dateFrom: "", dateTo: "", carId: "ALL", locationId: "ALL", paymentStatus: "ALL" };

export const BOOKING_STATUSES = ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "DRIVER_ASSIGNED", "OUT_FOR_PICKUP", "ACTIVE", "COMPLETED", "CANCELLED", "REJECTED"];

const ymd = (d: Date) => format(d, "yyyy-MM-dd");
const parse = (s: string) => (s ? new Date(`${s}T00:00:00`) : undefined);

function DateRangeFilter({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const selected: DateRange | undefined = from || to ? { from: parse(from), to: parse(to) } : undefined;

  const preset = (days: number, startOffset = 0) => {
    const start = new Date();
    start.setDate(start.getDate() + startOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    onChange(ymd(start), ymd(end));
    setOpen(false);
  };

  const label = from ? `${format(parse(from)!, "d MMM")}${to ? ` – ${format(parse(to)!, "d MMM yyyy")}` : " onwards"}` : "Pickup date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-52 justify-start gap-2 font-normal">
          <CalendarDays className="text-muted-foreground size-4" />
          <span className={from ? "" : "text-muted-foreground"}>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-wrap gap-1.5 border-b p-2">
          <Button size="sm" variant="ghost" onClick={() => preset(0)}>Today</Button>
          <Button size="sm" variant="ghost" onClick={() => preset(1, 1)}>Tomorrow</Button>
          <Button size="sm" variant="ghost" onClick={() => preset(6)}>Next 7 days</Button>
          <Button size="sm" variant="ghost" onClick={() => preset(-7, 0)}>Last 7 days</Button>
        </div>
        <div className="relative">
        <DayPicker
          mode="range"
          selected={selected}
          onSelect={(r) => onChange(r?.from ? ymd(r.from) : "", r?.to ? ymd(r.to) : r?.from ? ymd(r.from) : "")}
          numberOfMonths={2}
          className="p-3"
          classNames={{
            months: "flex gap-4",
            month_caption: "flex items-center justify-center py-1 text-sm font-semibold",
            nav: "absolute inset-x-3 top-3 flex items-center justify-between",
            button_previous: "inline-flex size-7 items-center justify-center rounded-md border hover:bg-muted",
            button_next: "inline-flex size-7 items-center justify-center rounded-md border hover:bg-muted",
            month_grid: "border-collapse",
            weekday: "text-muted-foreground w-9 pb-1 text-[11px] font-medium",
            day: "size-9 p-0 text-center text-sm",
            day_button: "size-9 rounded-md hover:bg-muted",
            selected: "bg-primary text-primary-foreground rounded-md",
            range_middle: "bg-primary/15 rounded-none",
            today: "font-bold text-primary",
            outside: "text-muted-foreground/40",
          }}
        />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Filter bar for the admin bookings list. `fixedStatus` hides the status filter on status-specific pages. */
export function BookingsFilters({ value, onChange, fixedStatus }: { value: BookingFilterValues; onChange: (v: BookingFilterValues) => void; fixedStatus?: boolean }) {
  const [searchInput, setSearchInput] = React.useState(value.search);
  const debounced = useDebouncedValue(searchInput, 300);
  const valueRef = React.useRef(value);
  valueRef.current = value;

  React.useEffect(() => {
    if (debounced !== valueRef.current.search) onChange({ ...valueRef.current, search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const cars = useLookupOptions<{ id: string; name: string }>("/cars", "name");
  const locations = useLookupOptions<{ id: string; name: string }>("/locations", "name");

  const set = (patch: Partial<BookingFilterValues>) => onChange({ ...value, ...patch });
  const activeCount = [value.search, value.status !== "ALL" && !fixedStatus, value.dateFrom, value.carId !== "ALL", value.locationId !== "ALL", value.paymentStatus !== "ALL"].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs min-w-56">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Reference, name, phone, email…" className="pl-8" />
      </div>

      {!fixedStatus && (
        <Select value={value.status} onValueChange={(v) => set({ status: v })}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {BOOKING_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <DateRangeFilter from={value.dateFrom} to={value.dateTo} onChange={(dateFrom, dateTo) => set({ dateFrom, dateTo })} />

      <Select value={value.carId} onValueChange={(v) => set({ carId: v })}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Car" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All cars</SelectItem>
          {cars.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.locationId} onValueChange={(v) => set({ locationId: v })}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Location" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All locations</SelectItem>
          {locations.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.paymentStatus} onValueChange={(v) => set({ paymentStatus: v })}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Payment" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Any payment</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="unpaid">Unpaid</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={() => { setSearchInput(""); onChange({ ...EMPTY_FILTERS, status: value.status === "ALL" || !fixedStatus ? "ALL" : value.status }); }} className="gap-1">
          <X className="size-4" /> Clear ({activeCount})
        </Button>
      )}
    </div>
  );
}
