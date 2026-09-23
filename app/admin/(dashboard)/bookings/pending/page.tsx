"use client";

import { BookingsList } from "@/components/admin/bookings/bookings-list";

export default function PendingBookingsPage() {
  return <BookingsList title="Pending Bookings" description="Temporary holds awaiting confirmation — auto-released if not confirmed in time." status="PENDING" />;
}
