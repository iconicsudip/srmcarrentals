import { z } from "zod";

export const carPricingSchema = z.object({
  dailyPrice: z.coerce.number().nonnegative(),
  includedKmPerDay: z.coerce.number().int().nonnegative(),
  extraKmPrice: z.coerce.number().nonnegative(),
  extraHourPrice: z.coerce.number().nonnegative(),
  hourlyPrice: z.coerce.number().nonnegative().optional(),
  minHourlyBookingHours: z.coerce.number().int().positive().optional(),
  gracePeriodMinutes: z.union([z.literal(0), z.literal(15), z.literal(30), z.literal(45), z.literal(60)]),
  extraHourRoundingMode: z.enum(["EXACT_HOUR", "ROUND_UP"]),
});
export type CarPricingInput = z.infer<typeof carPricingSchema>;
