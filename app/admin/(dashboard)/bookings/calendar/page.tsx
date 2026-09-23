"use client";

import * as React from "react";
import Link from "next/link";

import { useBookingList, type BookingListItem } from "@/hooks/use-bookings";
import { MonthGrid } from "@/components/admin/bookings/month-grid";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function BookingCalendarPage() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth());

  // Fetch a generous page of bookings and group client-side by pickup date —
  // fine at this data scale; swap for a dedicated date-range query if the
  // booking volume grows large enough to matter.
  const { data, isLoading } = useBookingList({ page: 1, limit: 200 });

  const byDate = React.useMemo(() => {
    const map = new Map<string, BookingListItem[]>();
    for (const booking of data?.data ?? []) {
      const key = dateKey(new Date(booking.pickupDateTime));
      const list = map.get(key) ?? [];
      list.push(booking);
      map.set(key, list);
    }
    return map;
  }, [data]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Booking Calendar</h1>
        <p className="text-muted-foreground text-sm">Bookings grouped by pickup date.</p>
      </div>

      {isLoading ? (
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
            const bookings = byDate.get(dateKey(date)) ?? [];
            return (
              <div className="flex flex-col gap-1">
                {bookings.slice(0, 3).map((b) => (
                  <Link key={b.id} href={`/admin/bookings/${b.id}`}>
                    <Badge variant="outline" className="block w-full truncate text-[10px]">
                      {b.bookingReference}
                    </Badge>
                  </Link>
                ))}
                {bookings.length > 3 && <span className="text-muted-foreground text-[10px]">+{bookings.length - 3} more</span>}
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
