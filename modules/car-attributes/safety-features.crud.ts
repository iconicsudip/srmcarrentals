import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { nameStatusSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = nameStatusSchema({
  icon: z.string().max(60).optional(),
});

export const safetyFeaturesCrud = createLookupCrud({
  delegate: prisma.safetyFeature,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Safety feature not found",
});
