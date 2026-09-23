import { z } from "zod";

export const createSeasonalPricingSchema = z
  .object({
    name: z.string().min(1).max(120),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    adjustmentType: z.enum(["FIXED_INCREASE", "PERCENTAGE_INCREASE", "FIXED_DISCOUNT", "PERCENTAGE_DISCOUNT"]),
    adjustmentValue: z.coerce.number().nonnegative(),
    appliesToAll: z.boolean().optional().default(true),
    carId: z.string().optional(),
    carCategoryId: z.string().optional(),
    carTypeId: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });
export type CreateSeasonalPricingInput = z.infer<typeof createSeasonalPricingSchema>;

export const updateSeasonalPricingSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  adjustmentType: z.enum(["FIXED_INCREASE", "PERCENTAGE_INCREASE", "FIXED_DISCOUNT", "PERCENTAGE_DISCOUNT"]).optional(),
  adjustmentValue: z.coerce.number().nonnegative().optional(),
  appliesToAll: z.boolean().optional(),
  carId: z.string().optional(),
  carCategoryId: z.string().optional(),
  carTypeId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
export type UpdateSeasonalPricingInput = z.infer<typeof updateSeasonalPricingSchema>;
