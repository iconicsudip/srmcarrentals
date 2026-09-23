"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { useLookupOptions } from "@/hooks/use-lookup-options";
import { useBookingList } from "@/hooks/use-bookings";
import { MonthGrid } from "@/components/admin/bookings/month-grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const BLOCKING_STATUSES = new Set(["PENDING", "PAYMENT_PENDING", "CONFIRMED", "DRIVER_ASSIGNED", "OUT_FOR_PICKUP", "ACTIVE"]);

export default function AvailabilityCalendarPage() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth());
  const [carId, setCarId] = React.useState("");

  const cars = useLookupOptions<{ id: string; name: string }>("/cars", "name");
  const { data, isLoading } = useBookingList({ page: 1, limit: 200, carId });

  const blockingRanges = React.useMemo(
    () =>
      (data?.data ?? [])
        .filter((b) => BLOCKING_STATUSES.has(b.status))
        .map((b) => ({ start: new Date(b.pickupDateTime), end: new Date(b.dropDateTime), ref: b.bookingReference })),
    [data],
  );

  function isBooked(date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return blockingRanges.find((r) => r.start < dayEnd && r.end > dayStart);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Availability Calendar</h1>
        <p className="text-muted-foreground text-sm">Select a car to see which dates are booked.</p>
      </div>

      <Select value={carId} onValueChange={setCarId}>
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Select a car" />
        </SelectTrigger>
        <SelectContent>
          {cars.options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!carId ? (
        <p className="text-muted-foreground py-12 text-center text-sm">Select a car above to view its availability.</p>
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <MonthGrid
          year={year}
          month={month}
          onNavigate={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
          renderDay={(date) => {
            const booking = isBooked(date);
            return booking ? (
              <div className="flex items-center gap-1 text-[10px] text-red-500" title={booking.ref}>
                <XCircle className="size-3" /> Booked
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-emerald-500">
                <CheckCircle2 className="size-3" /> Free
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
