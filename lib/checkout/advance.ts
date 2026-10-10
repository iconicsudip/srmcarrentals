/** Default advance for online bookings; the live value comes from Admin → Settings → Payments. */
export const ADVANCE_PERCENT = 30;

/** Split a rental amount into the advance paid now and the balance paid at handover. */
export function splitAdvance(total: number, percent: number = ADVANCE_PERCENT): { now: number; later: number } {
  const safe = Math.max(0, total);
  const pct = Math.min(100, Math.max(1, percent));
  const now = Math.round((safe * pct) / 100);
  return { now, later: safe - now };
}
