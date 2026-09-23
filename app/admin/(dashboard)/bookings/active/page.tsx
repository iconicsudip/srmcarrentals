"use client";

import { BookingsList } from "@/components/admin/bookings/bookings-list";

export default function ActiveRentalsPage() {
  return <BookingsList title="Active Rentals" description="Cars currently out with a customer." status="ACTIVE" />;
}
