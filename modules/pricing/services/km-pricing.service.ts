import { roundCurrency } from "@srm/utils";

export interface KmPricingInput {
  fullDays: number;
  includedKmPerDay: number;
  extraKmPrice: number;
  estimatedKm: number;
}

export interface KmPricingResult {
  includedKm: number;
  extraKm: number;
  extraKmCharge: number;
}

/**
 * Included KM = includedKmPerDay * fullDays
 * Extra KM    = max(0, estimatedKm - includedKm)
 * Extra Charge = extraKm * extraKmPrice
 */
export function calculateKmPricing(input: KmPricingInput): KmPricingResult {
  const includedKm = input.fullDays * input.includedKmPerDay;
  const extraKm = Math.max(0, input.estimatedKm - includedKm);
  const extraKmCharge = roundCurrency(extraKm * input.extraKmPrice);

  return { includedKm, extraKm, extraKmCharge };
}
