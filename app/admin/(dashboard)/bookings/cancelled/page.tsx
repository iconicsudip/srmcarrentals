"use client";

import { BookingsList } from "@/components/admin/bookings/bookings-list";

export default function CancelledBookingsPage() {
  return <BookingsList title="Cancelled Bookings" description="Cancelled bookings and expired temporary holds." status="CANCELLED" />;
}
