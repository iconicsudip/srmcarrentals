import { z } from "zod";

export const createRentalPackageSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140).optional(),
  durationHours: z.coerce.number().int().positive(),
  includedKm: z.coerce.number().int().nonnegative(),
  basePrice: z.coerce.number().nonnegative(),
  extraKmPrice: z.coerce.number().nonnegative(),
  extraHourPrice: z.coerce.number().nonnegative(),
  scope: z.enum(["ALL_CARS", "SPECIFIC_CARS", "CAR_CATEGORY", "CAR_TYPE"]).default("ALL_CARS"),
  carCategoryId: z.string().optional(),
  carTypeId: z.string().optional(),
  carIds: z.array(z.string()).optional().default([]),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
export type CreateRentalPackageInput = z.infer<typeof createRentalPackageSchema>;

export const updateRentalPackageSchema = createRentalPackageSchema.partial();
export type UpdateRentalPackageInput = z.infer<typeof updateRentalPackageSchema>;
