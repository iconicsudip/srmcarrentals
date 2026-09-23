import { describe, expect, it } from "vitest";
import { CouponDiscountType } from "@srm/types";

import { validateAndCalculateCoupon, type CouponInput } from "@/modules/pricing/services/coupon-pricing.service";

const NOW = new Date("2026-06-15T00:00:00Z");

function baseCoupon(overrides: Partial<CouponInput> = {}): CouponInput {
  return {
    discountType: CouponDiscountType.PERCENTAGE,
    percentage: 10,
    fixedAmount: null,
    maxDiscount: null,
    minBookingAmount: null,
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-12-31"),
    usageLimit: null,
    usedCount: 0,
    status: "ACTIVE",
    ...overrides,
  };
}

describe("validateAndCalculateCoupon", () => {
  it("rejects a missing coupon", () => {
    const result = validateAndCalculateCoupon(null, 5000, NOW);
    expect(result.valid).toBe(false);
    expect(result.discount).toBe(0);
  });

  it("computes a percentage discount", () => {
    const result = validateAndCalculateCoupon(baseCoupon({ percentage: 10 }), 5000, NOW);
    expect(result.valid).toBe(true);
    expect(result.discount).toBe(500);
  });

  it("caps a percentage discount at maxDiscount", () => {
    const result = validateAndCalculateCoupon(baseCoupon({ percentage: 50, maxDiscount: 300 }), 5000, NOW);
    expect(result.discount).toBe(300);
  });

  it("computes a fixed discount", () => {
    const result = validateAndCalculateCoupon(
      baseCoupon({ discountType: CouponDiscountType.FIXED, fixedAmount: 500 }),
      5000,
      NOW,
    );
    expect(result.discount).toBe(500);
  });

  it("never discounts more than the subtotal", () => {
    const result = validateAndCalculateCoupon(
      baseCoupon({ discountType: CouponDiscountType.FIXED, fixedAmount: 999999 }),
      5000,
      NOW,
    );
    expect(result.discount).toBe(5000);
  });

  it("rejects an inactive coupon", () => {
    const result = validateAndCalculateCoupon(baseCoupon({ status: "INACTIVE" }), 5000, NOW);
    expect(result.valid).toBe(false);
  });

  it("rejects a coupon outside its date range", () => {
    const result = validateAndCalculateCoupon(
      baseCoupon({ startDate: new Date("2025-01-01"), endDate: new Date("2025-12-31") }),
      5000,
      NOW,
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/not valid/i);
  });

  it("rejects a coupon that has hit its usage limit", () => {
    const result = validateAndCalculateCoupon(baseCoupon({ usageLimit: 5, usedCount: 5 }), 5000, NOW);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/usage limit/i);
  });

  it("rejects a booking below the coupon's minimum amount", () => {
    const result = validateAndCalculateCoupon(baseCoupon({ minBookingAmount: 6000 }), 5000, NOW);
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/minimum booking/i);
  });
});
