import { describe, expect, it } from "vitest";

import { calculateHourlyPrice, shouldUseHourlyPricing } from "@/modules/pricing/services/hourly-pricing.service";

describe("hourly pricing mode", () => {
  it("bills strictly by the hour", () => {
    const result = calculateHourlyPrice({ totalHours: 4, hourlyPrice: 300 });
    expect(result.billableHours).toBe(4);
    expect(result.total).toBe(1200);
  });

  it("enforces a minimum booking duration", () => {
    const result = calculateHourlyPrice({ totalHours: 1, hourlyPrice: 300, minHourlyBookingHours: 3 });
    expect(result.billableHours).toBe(3);
    expect(result.total).toBe(900);
  });

  it("only applies to sub-24-hour rentals with an hourly rate configured", () => {
    expect(shouldUseHourlyPricing(4, 300)).toBe(true);
    expect(shouldUseHourlyPricing(4, null)).toBe(false);
    expect(shouldUseHourlyPricing(4, 0)).toBe(false);
    expect(shouldUseHourlyPricing(30, 300)).toBe(false);
  });
});
