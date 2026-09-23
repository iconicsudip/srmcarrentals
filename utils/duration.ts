import { ExtraHourRoundingMode } from "@srm/types";

export interface RentalDurationInput {
  pickupDateTime: Date | string;
  dropDateTime: Date | string;
  /** Minutes of grace allowed past a full-day boundary before extra-hour charges kick in. */
  gracePeriodMinutes?: number;
  /** How to bill the remaining time once the grace period is exceeded. */
  roundingMode?: ExtraHourRoundingMode;
  /** Size of one billing block in hours. Defaults to 24 (the standard daily
   * cycle); Rental Packages reuse this same formula with their own
   * `durationHours` (e.g. a 48-hour Weekend Package) as the block size. */
  blockHours?: number;
}

export interface RentalDurationResult {
  totalMinutes: number;
  totalHours: number;
  fullDays: number;
  /** Hours remaining after full 24h days, already adjusted for grace period + rounding. */
  extraHours: number;
  gracePeriodMinutes: number;
  gracePeriodApplied: boolean;
}

const DEFAULT_BLOCK_HOURS = 24;

/**
 * Core 24-hour rental duration formula (see PRICING FORMULA in the spec):
 *
 *   fullDays        = floor(totalHours / 24)
 *   remainingHours  = totalHours % 24
 *
 * A rental of 24 hours or less is always billed as one full day (the
 * industry-standard minimum booking unit) — this is what makes the spec's
 * worked examples come out exactly right:
 *   - exactly 24h            -> 1 day,  0 extra hours -> ₹5000
 *   - 25h (24h + 1h)         -> 1 day,  1 extra hour  -> ₹5250
 *   - 50h (2d + 2h)          -> 2 days, 2 extra hours -> ₹10500
 *
 * A configurable grace period absorbs a small overshoot past each full-day
 * boundary (e.g. 20 minutes late with a 30 minute grace period => 0 extra
 * charge). Once the overshoot exceeds the grace period, the admin-configured
 * rounding mode decides whether extra hours are billed exactly or rounded up
 * to the next full hour.
 *
 * This is pure date arithmetic shared between backend and frontend for
 * instant UI previews. The NestJS `pricing` module is still the sole
 * authority that turns this into money — the frontend must never persist or
 * submit a price computed from this function.
 */
export function calculateRentalDuration(input: RentalDurationInput): RentalDurationResult {
  const pickup = new Date(input.pickupDateTime);
  const drop = new Date(input.dropDateTime);
  const gracePeriodMinutes = input.gracePeriodMinutes ?? 0;
  const roundingMode = input.roundingMode ?? ExtraHourRoundingMode.ROUND_UP;
  const blockMinutes = (input.blockHours ?? DEFAULT_BLOCK_HOURS) * 60;

  const totalMinutes = Math.round((drop.getTime() - pickup.getTime()) / 60000);
  if (totalMinutes <= 0) {
    throw new Error("dropDateTime must be after pickupDateTime");
  }

  let fullDays: number;
  let remainingMinutes: number;

  if (totalMinutes <= blockMinutes) {
    fullDays = 1;
    remainingMinutes = 0;
  } else {
    fullDays = Math.floor(totalMinutes / blockMinutes);
    remainingMinutes = totalMinutes - fullDays * blockMinutes;
  }

  let gracePeriodApplied = false;
  let extraHours = 0;

  if (remainingMinutes > 0) {
    if (remainingMinutes <= gracePeriodMinutes) {
      gracePeriodApplied = true;
    } else {
      const exactHours = remainingMinutes / 60;
      extraHours =
        roundingMode === ExtraHourRoundingMode.ROUND_UP ? Math.ceil(exactHours) : Math.round(exactHours * 100) / 100;
    }
  }

  return {
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    fullDays,
    extraHours,
    gracePeriodMinutes,
    gracePeriodApplied,
  };
}
