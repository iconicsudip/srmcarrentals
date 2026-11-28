import { BookingStatus } from "@srm/types";

import { bookingScopeWhere, type LocationScope } from "@/lib/auth/location-scope";
import { prisma } from "@/lib/prisma";

export interface DashboardOverview {
  totalCars: number;
  activeCars: number;
  totalBookings: number;
  activeRentals: number;
  pendingBookings: number;
  totalCustomers: number;
  totalDrivers: number;
  revenueThisMonth: number;
}

/** `scope` limits the booking figures to a staff member's locations (omit it for the whole business). */
export async function getDashboardOverview(scope?: LocationScope | null): Promise<DashboardOverview> {
  const inScope = bookingScopeWhere(scope ?? null);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalCars,
    activeCars,
    totalBookings,
    activeRentals,
    pendingBookings,
    totalCustomers,
    totalDrivers,
    revenueAgg,
  ] = await Promise.all([
    prisma.car.count(),
    prisma.car.count({ where: { status: "ACTIVE" } }),
    prisma.booking.count({ where: inScope }),
    prisma.booking.count({ where: { status: BookingStatus.ACTIVE, ...inScope } }),
    prisma.booking.count({ where: { status: BookingStatus.PENDING, ...inScope } }),
    prisma.customer.count(),
    prisma.driver.count(),
    prisma.bookingPricingSnapshot.aggregate({
      _sum: { grandTotal: true },
      where: { createdAt: { gte: startOfMonth }, booking: inScope },
    }),
  ]);

  return {
    totalCars,
    activeCars,
    totalBookings,
    activeRentals,
    pendingBookings,
    totalCustomers,
    totalDrivers,
    revenueThisMonth: Number(revenueAgg._sum.grandTotal ?? 0),
  };
}
