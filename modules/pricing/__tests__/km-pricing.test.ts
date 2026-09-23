import { describe, expect, it } from "vitest";

import { calculateKmPricing } from "@/modules/pricing/services/km-pricing.service";

describe("calculateKmPricing — spec worked example", () => {
  it("300km/day included, 2 days, 700km travelled -> 100km extra @ ₹15 = ₹1500", () => {
    const result = calculateKmPricing({
      fullDays: 2,
      includedKmPerDay: 300,
      extraKmPrice: 15,
      estimatedKm: 700,
    });
    expect(result.includedKm).toBe(600);
    expect(result.extraKm).toBe(100);
    expect(result.extraKmCharge).toBe(1500);
  });

  it("travel within the included allowance incurs no extra charge", () => {
    const result = calculateKmPricing({
      fullDays: 1,
      includedKmPerDay: 300,
      extraKmPrice: 15,
      estimatedKm: 250,
    });
    expect(result.extraKm).toBe(0);
    expect(result.extraKmCharge).toBe(0);
  });
});
