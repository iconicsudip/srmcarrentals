"use client";

import { BookingsList } from "@/components/admin/bookings/bookings-list";

export default function CompletedBookingsPage() {
  return <BookingsList title="Completed Bookings" description="Finished rentals." status="COMPLETED" />;
}
