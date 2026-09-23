import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { namedLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = namedLookupSchema({
  logoUrl: z.string().url().optional(),
});

export const brandsCrud = createLookupCrud({
  delegate: prisma.carBrand,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Brand not found",
});
