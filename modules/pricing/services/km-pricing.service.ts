import { roundCurrency } from "@srm/utils";

export interface KmPricingInput {
  fullDays: number;
  includedKmPerDay: number;
  extraKmPrice: number;
  estimatedKm: number;
  /** Leftover hours beyond whole days — they earn KM pro-rata (24h = one day's KM). */
  extraHours?: number;
}

export interface KmPricingResult {
  includedKm: number;
  extraKm: number;
  extraKmCharge: number;
}

/**
 * Included KM = includedKmPerDay * (fullDays + extraHours / 24)
 * Extra KM    = max(0, estimatedKm - includedKm)
 * Extra Charge = extraKm * extraKmPrice
 */
export function calculateKmPricing(input: KmPricingInput): KmPricingResult {
  const includedKm = Math.round(input.includedKmPerDay * (input.fullDays + (input.extraHours ?? 0) / 24));
  const extraKm = Math.max(0, input.estimatedKm - includedKm);
  const extraKmCharge = roundCurrency(extraKm * input.extraKmPrice);

  return { includedKm, extraKm, extraKmCharge };
}
