import { z } from "zod";

const optionalId = z.string().min(1).nullable().optional();

export const createCarSchema = z.object({
  // basic information
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(180).optional(),
  shortDescription: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  brandId: z.string().min(1, "Brand is required"),
  modelId: z.string().min(1, "Model is required"),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  categoryId: z.string().min(1, "Category is required"),
  carTypeId: z.string().min(1, "Car type is required"),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "MAINTENANCE"]).optional(),
  isFeatured: z.boolean().optional(),

  // specifications
  seatOptionId: optionalId,
  doorOptionId: optionalId,
  cylinderOptionId: optionalId,
  transmissionTypeId: optionalId,
  fuelTypeId: optionalId,
  steeringTypeId: optionalId,
  carCapacityId: optionalId,

  // appearance
  colorId: optionalId,
  exteriorColorId: optionalId,
  interiorColorId: optionalId,

  // features
  featureIds: z.array(z.string()).default([]),
  safetyFeatureIds: z.array(z.string()).default([]),
});
export type CreateCarInput = z.infer<typeof createCarSchema>;

export const updateCarSchema = createCarSchema.partial();
export type UpdateCarInput = z.infer<typeof updateCarSchema>;

export const carImageMetaSchema = z.object({
  altText: z.string().max(200).optional(),
  isFeatured: z.boolean().optional(),
});

export const reorderImagesSchema = z.object({
  order: z.array(z.string().min(1)).min(1),
});
