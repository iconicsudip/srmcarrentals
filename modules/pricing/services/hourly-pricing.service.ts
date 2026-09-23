import { roundCurrency } from "@srm/utils";

export interface HourlyPricingInput {
  totalHours: number;
  hourlyPrice: number;
  minHourlyBookingHours?: number;
}

export interface HourlyPricingResult {
  billableHours: number;
  total: number;
}

/** Pure hourly rental mode: short rentals (< 24h) billed strictly by the
 * hour instead of the 24-hour daily formula, subject to a configurable
 * minimum booking duration. */
export function calculateHourlyPrice(input: HourlyPricingInput): HourlyPricingResult {
  const billableHours = Math.max(input.totalHours, input.minHourlyBookingHours ?? 0);
  return { billableHours, total: roundCurrency(billableHours * input.hourlyPrice) };
}

/** Hourly mode only applies to sub-24-hour rentals on cars that have an
 * hourly rate configured — 24h+ rentals always use the daily formula. */
export function shouldUseHourlyPricing(totalHours: number, hourlyPrice?: number | null): boolean {
  return !!hourlyPrice && hourlyPrice > 0 && totalHours < 24;
}
