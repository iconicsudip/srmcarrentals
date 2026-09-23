import { describe, expect, it } from "vitest";
import { calculateRentalDuration } from "@srm/utils";
import { ExtraHourRoundingMode } from "@srm/types";

describe("calculateRentalDuration — spec worked examples", () => {
  it("exactly 24 hours -> 1 day, 0 extra hours", () => {
    const result = calculateRentalDuration({
      pickupDateTime: "2026-01-01T10:00:00",
      dropDateTime: "2026-01-02T10:00:00",
    });
    expect(result.fullDays).toBe(1);
    expect(result.extraHours).toBe(0);
  });

  it("24h + 1h (drop 1 hour late) -> 1 day, 1 extra hour", () => {
    const result = calculateRentalDuration({
      pickupDateTime: "2026-01-01T10:00:00",
      dropDateTime: "2026-01-02T11:00:00",
    });
    expect(result.fullDays).toBe(1);
    expect(result.extraHours).toBe(1);
  });

  it("50 hours (2 days + 2 hours) -> 2 days, 2 extra hours", () => {
    const result = calculateRentalDuration({
      pickupDateTime: "2026-01-01T10:00:00",
      dropDateTime: "2026-01-03T12:00:00",
    });
    expect(result.fullDays).toBe(2);
    expect(result.extraHours).toBe(2);
  });

  it("24h + 20min with a 30min grace period -> no extra charge", () => {
    const result = calculateRentalDuration({
      pickupDateTime: "2026-01-01T10:00:00",
      dropDateTime: "2026-01-02T10:20:00",
      gracePeriodMinutes: 30,
    });
    expect(result.fullDays).toBe(1);
    expect(result.extraHours).toBe(0);
    expect(result.gracePeriodApplied).toBe(true);
  });

  it("24h + 45min with a 30min grace period, ROUND_UP -> 1 extra hour billed", () => {
    const result = calculateRentalDuration({
      pickupDateTime: "2026-01-01T10:00:00",
      dropDateTime: "2026-01-02T10:45:00",
      gracePeriodMinutes: 30,
      roundingMode: ExtraHourRoundingMode.ROUND_UP,
    });
    expect(result.fullDays).toBe(1);
    expect(result.extraHours).toBe(1);
    expect(result.gracePeriodApplied).toBe(false);
  });

  it("24h + 45min with a 30min grace period, EXACT_HOUR -> 0.25h billed (only the overage past grace)", () => {
    const result = calculateRentalDuration({
      pickupDateTime: "2026-01-01T10:00:00",
      dropDateTime: "2026-01-02T10:45:00",
      gracePeriodMinutes: 30,
      roundingMode: ExtraHourRoundingMode.EXACT_HOUR,
    });
    expect(result.fullDays).toBe(1);
    expect(result.extraHours).toBe(0.75);
  });

  it("a rental under 24 hours is still billed as a minimum of 1 full day", () => {
    const result = calculateRentalDuration({
      pickupDateTime: "2026-01-01T10:00:00",
      dropDateTime: "2026-01-01T15:00:00",
    });
    expect(result.fullDays).toBe(1);
    expect(result.extraHours).toBe(0);
  });

  it("supports a custom block size for Rental Packages (e.g. a 48-hour package)", () => {
    const result = calculateRentalDuration({
      pickupDateTime: "2026-01-01T10:00:00",
      dropDateTime: "2026-01-03T12:00:00", // 50 hours
      blockHours: 48,
    });
    expect(result.fullDays).toBe(1); // one 48h block
    expect(result.extraHours).toBe(2); // 2h over the block
  });

  it("throws when drop is not after pickup", () => {
    expect(() =>
      calculateRentalDuration({ pickupDateTime: "2026-01-02T10:00:00", dropDateTime: "2026-01-01T10:00:00" }),
    ).toThrow();
  });
});
