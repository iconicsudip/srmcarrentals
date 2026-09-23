import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { namedLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = namedLookupSchema({
  category: z.string().min(1).max(60),
  imageUrl: z.string().optional().or(z.literal("")),
  idealFor: z.string().max(300).optional().or(z.literal("")),
  capacityLabel: z.string().max(120).optional().or(z.literal("")),
  features: z.array(z.string()).optional().default([]),
  pricePerKm: z.coerce.number().nonnegative().optional(),
  startingPrice: z.coerce.number().nonnegative(),
  pricingUnit: z.enum(["PER_TRIP", "PER_KM"]).optional().default("PER_TRIP"),
  badge: z.string().max(40).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const chauffeurServicesCrud = createLookupCrud({
  delegate: prisma.chauffeurService,
  createSchema,
  updateSchema,
  searchFields: ["name", "category"],
  orderBy: { sortOrder: "asc" },
  notFoundMessage: "Chauffeur service not found",
});
