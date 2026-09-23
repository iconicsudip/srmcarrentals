import { BookingStatus } from "@srm/types";

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

export async function getDashboardOverview(): Promise<DashboardOverview> {
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
  ] = await prisma.$transaction([
    prisma.car.count(),
    prisma.car.count({ where: { status: "ACTIVE" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.ACTIVE } }),
    prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
    prisma.customer.count(),
    prisma.driver.count(),
    prisma.bookingPricingSnapshot.aggregate({
      _sum: { grandTotal: true },
      where: { createdAt: { gte: startOfMonth } },
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
