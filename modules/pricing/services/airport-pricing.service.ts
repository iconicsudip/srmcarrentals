import { roundCurrency } from "@srm/utils";

export interface AirportLegInput {
  isAirport: boolean;
  /** Explicit charge from AirportLocationCharge, if the admin configured one for this airport<->location pair. */
  explicitCharge?: number;
  /** Distance-based fallback, used only when no explicit charge exists. */
  distanceFallback?: {
    distanceKm: number;
    baseCharge: number;
    includedKm: number;
    extraKmPrice: number;
  };
}

/**
 * Airport pickup/drop charge for one leg of the trip.
 *
 * Priority: explicit AirportLocationCharge row > distance-based
 * AirportDistancePricing fallback > ₹0 (admin simply hasn't configured this
 * airport<->location pair yet).
 *
 * Distance fallback example from the spec:
 *   Base Charge = ₹500, Included KM = 20, Extra KM = ₹20, distance = 35km
 *   -> extraKm = 15 -> charge = 500 + 15*20 = ₹800
 */
export function calculateAirportLegCharge(input: AirportLegInput): number {
  if (!input.isAirport) return 0;

  if (input.explicitCharge !== undefined) {
    return roundCurrency(input.explicitCharge);
  }

  if (input.distanceFallback) {
    const { distanceKm, baseCharge, includedKm, extraKmPrice } = input.distanceFallback;
    const extraKm = Math.max(0, distanceKm - includedKm);
    return roundCurrency(baseCharge + extraKm * extraKmPrice);
  }

  return 0;
}
