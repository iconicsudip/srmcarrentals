import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@srm/types";

export const BOOKING_HOLD_QUEUE_NAME = "booking-hold-expiry";

// In-memory hold timers map (bookingId -> Timeout)
const holdTimers = new Map<string, NodeJS.Timeout>();

/**
 * Schedules a delayed job that releases a "Temporary Hold" booking if it's
 * still unconfirmed once the hold window elapses. Uses an in-memory timer
 * backed by database verification, with zero Redis dependency.
 */
export async function scheduleBookingHoldExpiry(bookingId: string, delayMs: number): Promise<void> {
  const existing = holdTimers.get(bookingId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    try {
      holdTimers.delete(bookingId);
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (booking && booking.status === BookingStatus.PENDING) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED },
        });
        console.log(`[Hold Expired] Booking ${bookingId} released automatically.`);
      }
    } catch (e) {
      console.error(`[Hold Expiry Error] ${bookingId}:`, e);
    }
  }, delayMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  holdTimers.set(bookingId, timer);
}

export async function cancelBookingHoldJob(bookingId: string): Promise<void> {
  const timer = holdTimers.get(bookingId);
  if (timer) {
    clearTimeout(timer);
    holdTimers.delete(bookingId);
  }
}
