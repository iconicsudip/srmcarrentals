import type { Prisma, PrismaClient } from "@prisma/client";
import { BLOCKING_BOOKING_STATUSES } from "@srm/types";

type TxClient = PrismaClient | Prisma.TransactionClient;

/**
 * A car is unavailable for [pickup, drop) if any existing booking in a
 * blocking status (Temporary Hold, Payment Pending, Confirmed, Driver
 * Assigned, Out for Pickup, Active) overlaps that range. Two ranges
 * [a1,a2) and [b1,b2) overlap iff a1 < b2 AND b1 < a2.
 */
export async function isCarAvailable(
  tx: TxClient,
  carId: string,
  pickupDateTime: Date,
  dropDateTime: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const conflict = await tx.booking.findFirst({
    where: {
      carId,
      status: { in: BLOCKING_BOOKING_STATUSES as Prisma.EnumBookingStatusFilter["in"] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      pickupDateTime: { lt: dropDateTime },
      dropDateTime: { gt: pickupDateTime },
    },
    select: { id: true },
  });

  return !conflict;
}

/** Locks the car row for the duration of the enclosing transaction so two
 * concurrent booking attempts for the same car can't both pass the
 * availability check before either has committed (the classic double-
 * booking race condition). Must be called inside a `prisma.$transaction`. */
export async function lockCarForBooking(tx: Prisma.TransactionClient, carId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM cars WHERE id = ${carId} FOR UPDATE`;
}
