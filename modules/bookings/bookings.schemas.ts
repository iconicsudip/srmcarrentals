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
    kmPlan: z.coerce.number().int().min(1).max(3).optional().default(1),
    rentalPackageId: z.string().optional(),
    extraServiceIds: z.array(z.string()).optional().default([]),
    insuranceId: z.string().optional(),
    couponCode: z.string().optional(),
    paymentMethod: z.enum(["PICKUP", "ONLINE"]).optional().default("PICKUP"),
    /** Extra checkout details (license, city, selected package, consents…) saved alongside the booking. */
    details: z
      .object({
        customer: z
          .object({
            licenseNumber: z.string().max(40).optional(),
            aadhaarNumber: z.string().max(20).optional(),
            city: z.string().max(100).optional(),
            emailProvided: z.boolean().optional(),
            hasValidLicense: z.boolean().optional(),
            agreedToTerms: z.boolean().optional(),
          })
          .optional(),
        selection: z
          .object({
            rentalMode: z.enum(["DAILY", "HOURLY"]).optional(),
            kmLimit: z.number().nonnegative().optional(),
            extraKmPrice: z.number().nonnegative().optional(),
            deliveryType: z.enum(["BRANCH", "AIRPORT", "DOORSTEP"]).optional(),
            locationLabel: z.string().max(200).optional(),
            durationText: z.string().max(60).optional(),
            insuranceName: z.string().max(120).optional(),
            extraServiceNames: z.array(z.string().max(120)).max(30).optional(),
            couponCode: z.string().max(40).optional(),
            securityDeposit: z.number().nonnegative().optional(),
          })
          .optional(),
        payment: z
          .object({
            grandTotal: z.number().nonnegative().optional(),
            payableNow: z.number().nonnegative().optional(),
            payableLater: z.number().nonnegative().optional(),
          })
          .optional(),
      })
      .optional(),
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
