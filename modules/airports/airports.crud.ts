import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { namedLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = namedLookupSchema({
  code: z
    .string()
    .min(3)
    .max(4)
    .transform((v) => v.toUpperCase()),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const airportsCrud = createLookupCrud({
  delegate: prisma.airport,
  createSchema,
  updateSchema,
  searchFields: ["name", "code", "city"],
  notFoundMessage: "Airport not found",
});
