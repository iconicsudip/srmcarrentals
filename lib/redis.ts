/**
 * Redis is not needed for SRM Car Rentals.
 * Booking hold expiration is managed via in-memory timers with database verification.
 */
export function getRedis(): null {
  return null;
}
