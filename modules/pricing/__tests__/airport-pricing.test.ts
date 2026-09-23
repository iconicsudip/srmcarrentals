import { describe, expect, it } from "vitest";

import { calculateAirportLegCharge } from "@/modules/pricing/services/airport-pricing.service";

describe("calculateAirportLegCharge", () => {
  it("returns 0 when the leg isn't at an airport", () => {
    expect(calculateAirportLegCharge({ isAirport: false })).toBe(0);
  });

  it("uses the explicit admin-configured charge when available", () => {
    // BLR Airport -> Whitefield example from the spec
    expect(calculateAirportLegCharge({ isAirport: true, explicitCharge: 700 })).toBe(700);
  });

  it("distance-based fallback: base ₹500, included 20km, ₹20/extra km, 35km travelled -> ₹800", () => {
    const charge = calculateAirportLegCharge({
      isAirport: true,
      distanceFallback: { distanceKm: 35, baseCharge: 500, includedKm: 20, extraKmPrice: 20 },
    });
    expect(charge).toBe(800);
  });

  it("distance fallback never goes below the base charge", () => {
    const charge = calculateAirportLegCharge({
      isAirport: true,
      distanceFallback: { distanceKm: 5, baseCharge: 500, includedKm: 20, extraKmPrice: 20 },
    });
    expect(charge).toBe(500);
  });

  it("returns 0 when the airport leg has no charge configured at all", () => {
    expect(calculateAirportLegCharge({ isAirport: true })).toBe(0);
  });
});
