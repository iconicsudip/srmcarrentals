import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { namedLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = namedLookupSchema({
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
});

export const categoriesCrud = createLookupCrud({
  delegate: prisma.carCategory,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Car category not found",
});
