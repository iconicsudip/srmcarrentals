import { calculateRentalDuration, roundCurrency } from "@srm/utils";
import { ExtraHourRoundingMode } from "@srm/types";

export interface RentalPricingInput {
  pickupDateTime: Date;
  dropDateTime: Date;
  /** Price per billing block — the car's 24-hour price, or a Rental Package's flat basePrice. */
  unitPrice: number;
  extraHourPrice: number;
  gracePeriodMinutes: number;
  roundingMode: ExtraHourRoundingMode;
  /** Hours per billing block. 24 for the standard daily cycle; a Rental
   * Package supplies its own (e.g. 48 for a "Weekend Package"). */
  blockHours?: number;
}

export interface RentalPricingResult {
  totalHours: number;
  fullDays: number;
  extraHours: number;
  gracePeriodMinutes: number;
  gracePeriodApplied: boolean;
  basePrice: number;
  extraHourCharge: number;
  rentalTotal: number;
}

/**
 * Implements the spec's core 24-hour pricing formula:
 *   fullDays       = floor(totalHours / 24)
 *   remainingHours = totalHours % 24
 *   basePrice      = fullDays * dailyPrice
 *   extraHourPrice = remainingHours * hourlyPrice   (after grace period)
 *   total          = basePrice + extraHourPrice
 */
export function calculateRentalPrice(input: RentalPricingInput): RentalPricingResult {
  const duration = calculateRentalDuration({
    pickupDateTime: input.pickupDateTime,
    dropDateTime: input.dropDateTime,
    gracePeriodMinutes: input.gracePeriodMinutes,
    roundingMode: input.roundingMode,
    blockHours: input.blockHours,
  });

  const basePrice = roundCurrency(duration.fullDays * input.unitPrice);
  const extraHourCharge = roundCurrency(duration.extraHours * input.extraHourPrice);

  return {
    totalHours: duration.totalHours,
    fullDays: duration.fullDays,
    extraHours: duration.extraHours,
    gracePeriodMinutes: duration.gracePeriodMinutes,
    gracePeriodApplied: duration.gracePeriodApplied,
    basePrice,
    extraHourCharge,
    rentalTotal: roundCurrency(basePrice + extraHourCharge),
  };
}
