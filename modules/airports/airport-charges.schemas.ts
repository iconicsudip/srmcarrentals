import { z } from "zod";

export const createAirportChargeSchema = z.object({
  airportId: z.string().min(1),
  locationId: z.string().min(1),
  pickupCharge: z.coerce.number().nonnegative(),
  dropCharge: z.coerce.number().nonnegative(),
  roundTripCharge: z.coerce.number().nonnegative().optional(),
});
export type CreateAirportChargeInput = z.infer<typeof createAirportChargeSchema>;

export const updateAirportChargeSchema = createAirportChargeSchema.partial().omit({ airportId: true, locationId: true });
export type UpdateAirportChargeInput = z.infer<typeof updateAirportChargeSchema>;

export const distancePricingSchema = z.object({
  baseCharge: z.coerce.number().nonnegative(),
  includedKm: z.coerce.number().nonnegative(),
  extraKmPrice: z.coerce.number().nonnegative(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
