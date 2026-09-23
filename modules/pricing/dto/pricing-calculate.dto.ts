import { z } from "zod";

export const pricingCalculateSchema = z
  .object({
    carId: z.string().min(1),
    pickupDateTime: z.coerce.date(),
    dropDateTime: z.coerce.date(),
    pickupLocationId: z.string().min(1).optional(),
    dropLocationId: z.string().min(1).optional(),
    pickupIsAirport: z.boolean().optional().default(false),
    dropIsAirport: z.boolean().optional().default(false),
    pickupAirportId: z.string().min(1).optional(),
    dropAirportId: z.string().min(1).optional(),
    estimatedKm: z.coerce.number().nonnegative().optional().default(0),
    rentalPackageId: z.string().min(1).optional(),
    extraServiceIds: z.array(z.string()).optional().default([]),
    insuranceId: z.string().min(1).optional(),
    couponCode: z.string().min(1).optional(),
  })
  .refine((data) => data.dropDateTime > data.pickupDateTime, {
    message: "dropDateTime must be after pickupDateTime",
    path: ["dropDateTime"],
  })
  .refine((data) => !data.pickupIsAirport || !!data.pickupAirportId, {
    message: "pickupAirportId is required when pickupIsAirport is true",
    path: ["pickupAirportId"],
  })
  .refine((data) => !data.dropIsAirport || !!data.dropAirportId, {
    message: "dropAirportId is required when dropIsAirport is true",
    path: ["dropAirportId"],
  });

export type PricingCalculateDto = z.infer<typeof pricingCalculateSchema>;
