import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { namedLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = namedLookupSchema({
  categoryId: z.string().min(1),
  imageUrl: z.string().optional().or(z.literal("")),
  rating: z.coerce.number().min(0).max(5).optional().default(5),
  durationDays: z.coerce.number().int().positive(),
  durationNights: z.coerce.number().int().nonnegative(),
  description: z.string().max(1000).optional().or(z.literal("")),
  keyExperiences: z.array(z.string()).optional().default([]),
  assignedCarId: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  startingPrice: z.coerce.number().nonnegative(),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const toursCrud = createLookupCrud({
  delegate: prisma.tour,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  orderBy: { sortOrder: "asc" },
  include: { category: true, assignedCar: true },
  notFoundMessage: "Tour not found",
});
