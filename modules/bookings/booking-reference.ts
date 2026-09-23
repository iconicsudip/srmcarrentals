import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

/** e.g. "SRM-20260917-K3F9QZ" — date-prefixed for readability, with a short
 * random suffix (not a sequential counter) so concurrent bookings never race
 * on a shared counter. */
export function generateBookingReference(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `SRM-${date}-${nanoid()}`;
}
