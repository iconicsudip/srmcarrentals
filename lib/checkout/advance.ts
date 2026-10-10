/** Online bookings are secured with a percentage advance; the rest is paid at handover. */
export const ADVANCE_PERCENT = 30;

export function splitAdvance(total: number): { now: number; later: number } {
  const safe = Math.max(0, total);
  const now = Math.round((safe * ADVANCE_PERCENT) / 100);
  return { now, later: safe - now };
}
