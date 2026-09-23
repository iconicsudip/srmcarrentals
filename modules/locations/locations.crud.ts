import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { namedLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = namedLookupSchema({
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  serviceRadiusKm: z.coerce.number().positive().optional(),
});

export const locationsCrud = createLookupCrud({
  delegate: prisma.location,
  createSchema,
  updateSchema,
  searchFields: ["name", "city", "state"],
  notFoundMessage: "Location not found",
});
