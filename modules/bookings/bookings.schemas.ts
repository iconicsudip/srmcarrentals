import { z } from "zod";

export const createBookingSchema = z
  .object({
    carId: z.string().min(1),
    // Either an existing customerId (admin flow) or inline guest details
    // (public booking flow) — the service upserts a Customer row from these.
    customerId: z.string().min(1).optional(),
    customer: z
      .object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        userId: z.string().optional(),
      })
      .optional(),
    pickupDateTime: z.coerce.date(),
    dropDateTime: z.coerce.date(),
    pickupLocationId: z.string().optional(),
    dropLocationId: z.string().optional(),
    pickupIsAirport: z.boolean().optional().default(false),
    dropIsAirport: z.boolean().optional().default(false),
    pickupAirportId: z.string().optional(),
    dropAirportId: z.string().optional(),
    estimatedKm: z.coerce.number().nonnegative().optional().default(0),
    rentalPackageId: z.string().optional(),
    extraServiceIds: z.array(z.string()).optional().default([]),
    insuranceId: z.string().optional(),
    couponCode: z.string().optional(),
  })
  .refine((data) => data.customerId || data.customer, {
    message: "Either customerId or customer details are required",
    path: ["customer"],
  })
  .refine((data) => data.dropDateTime > data.pickupDateTime, {
    message: "dropDateTime must be after pickupDateTime",
    path: ["dropDateTime"],
  });
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const assignDriverSchema = z.object({
  driverId: z.string().min(1),
});
