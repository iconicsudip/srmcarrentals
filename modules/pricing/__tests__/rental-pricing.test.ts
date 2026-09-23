import { describe, expect, it } from "vitest";
import { ExtraHourRoundingMode } from "@srm/types";

import { calculateRentalPrice } from "@/modules/pricing/services/rental-pricing.service";

const BASE_INPUT = {
  unitPrice: 5000,
  extraHourPrice: 250,
  gracePeriodMinutes: 0,
  roundingMode: ExtraHourRoundingMode.ROUND_UP,
};

describe("calculateRentalPrice — spec worked examples", () => {
  it("24h exactly -> ₹5000", () => {
    const result = calculateRentalPrice({
      ...BASE_INPUT,
      pickupDateTime: new Date("2026-01-01T10:00:00"),
      dropDateTime: new Date("2026-01-02T10:00:00"),
    });
    expect(result.basePrice).toBe(5000);
    expect(result.extraHourCharge).toBe(0);
    expect(result.rentalTotal).toBe(5000);
  });

  it("24h + 1h late -> ₹5250 (base ₹5000 + 1 extra hour ₹250)", () => {
    const result = calculateRentalPrice({
      ...BASE_INPUT,
      pickupDateTime: new Date("2026-01-01T10:00:00"),
      dropDateTime: new Date("2026-01-02T11:00:00"),
    });
    expect(result.basePrice).toBe(5000);
    expect(result.extraHourCharge).toBe(250);
    expect(result.rentalTotal).toBe(5250);
  });

  it("50h (48h + 2h) -> ₹10500 (2 days ₹10000 + 2 extra hours ₹500)", () => {
    const result = calculateRentalPrice({
      ...BASE_INPUT,
      pickupDateTime: new Date("2026-01-01T10:00:00"),
      dropDateTime: new Date("2026-01-03T12:00:00"),
    });
    expect(result.fullDays).toBe(2);
    expect(result.basePrice).toBe(10000);
    expect(result.extraHours).toBe(2);
    expect(result.extraHourCharge).toBe(500);
    expect(result.rentalTotal).toBe(10500);
  });

  it("respects a configured grace period", () => {
    const result = calculateRentalPrice({
      ...BASE_INPUT,
      gracePeriodMinutes: 30,
      pickupDateTime: new Date("2026-01-01T10:00:00"),
      dropDateTime: new Date("2026-01-02T10:20:00"),
    });
    expect(result.extraHourCharge).toBe(0);
    expect(result.rentalTotal).toBe(5000);
  });
});
