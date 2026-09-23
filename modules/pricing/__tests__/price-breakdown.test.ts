import { describe, expect, it } from "vitest";
import { TaxType } from "@srm/types";
import { roundCurrency } from "@srm/utils";

import { calculateTax } from "@/modules/pricing/services/tax-pricing.service";

/**
 * Validates the exact worked "PRICE BREAKDOWN" example from the spec end to
 * end, using the same arithmetic pricing.service.ts performs (rental +
 * extra-hour + airport pickup/drop - discount = subtotal; subtotal + GST =
 * grand total), without needing a database:
 *
 *   Car Rental: ₹5000        Airport Pickup: ₹700
 *   Extra Hour: ₹250         Airport Drop:  ₹500
 *   Discount:  -₹500
 *   Subtotal:  ₹5950         GST (18%): ₹1071
 *   Grand Total: ₹7021
 */
describe("full price breakdown — spec worked example", () => {
  it("adds up to the documented grand total", () => {
    const carRental = 5000;
    const extraHour = 250;
    const airportPickup = 700;
    const airportDrop = 500;
    const discount = 500;

    const subtotal = roundCurrency(carRental + extraHour + airportPickup + airportDrop - discount);
    expect(subtotal).toBe(5950);

    const tax = calculateTax(subtotal, { name: "GST", type: TaxType.PERCENTAGE, percentage: 18 });
    expect(tax.amount).toBe(1071);

    const grandTotal = roundCurrency(subtotal + tax.amount);
    expect(grandTotal).toBe(7021);
  });
});
