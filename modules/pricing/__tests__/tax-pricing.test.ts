import { describe, expect, it } from "vitest";
import { TaxType } from "@srm/types";

import { calculateTax } from "@/modules/pricing/services/tax-pricing.service";

describe("calculateTax", () => {
  it("spec example: ₹5950 subtotal * 18% GST = ₹1071", () => {
    const result = calculateTax(5950, { name: "GST", type: TaxType.PERCENTAGE, percentage: 18 });
    expect(result.amount).toBe(1071);
  });

  it("returns 0 with no configured tax", () => {
    expect(calculateTax(5000, null).amount).toBe(0);
  });

  it("supports a flat/fixed tax amount", () => {
    const result = calculateTax(5000, { name: "Flat Fee", type: TaxType.FIXED, percentage: 100 });
    expect(result.amount).toBe(100);
  });
});
