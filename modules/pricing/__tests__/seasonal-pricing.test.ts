import { describe, expect, it } from "vitest";
import { SeasonalAdjustmentType } from "@srm/types";

import { calculateSeasonalAdjustment } from "@/modules/pricing/services/seasonal-pricing.service";

describe("calculateSeasonalAdjustment", () => {
  it("returns 0 with no applicable rule", () => {
    expect(calculateSeasonalAdjustment(5000, null)).toBe(0);
  });

  it("Christmas example: 20% increase on a ₹5000 base -> +₹1000", () => {
    const adjustment = calculateSeasonalAdjustment(5000, {
      type: SeasonalAdjustmentType.PERCENTAGE_INCREASE,
      value: 20,
    });
    expect(adjustment).toBe(1000);
  });

  it("fixed increase adds a flat amount regardless of base price", () => {
    expect(calculateSeasonalAdjustment(5000, { type: SeasonalAdjustmentType.FIXED_INCREASE, value: 300 })).toBe(300);
  });

  it("percentage discount returns a negative adjustment", () => {
    expect(
      calculateSeasonalAdjustment(5000, { type: SeasonalAdjustmentType.PERCENTAGE_DISCOUNT, value: 10 }),
    ).toBe(-500);
  });

  it("fixed discount returns a negative adjustment", () => {
    expect(calculateSeasonalAdjustment(5000, { type: SeasonalAdjustmentType.FIXED_DISCOUNT, value: 200 })).toBe(-200);
  });
});
