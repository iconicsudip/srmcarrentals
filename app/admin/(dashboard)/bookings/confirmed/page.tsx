"use client";

import { BookingsList } from "@/components/admin/bookings/bookings-list";

export default function ConfirmedBookingsPage() {
  return <BookingsList title="Confirmed Bookings" description="Confirmed and awaiting pickup." status="CONFIRMED" />;
}
