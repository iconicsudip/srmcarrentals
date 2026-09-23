import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { nameStatusSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = nameStatusSchema({
  icon: z.string().max(60).optional(),
});

export const featuresCrud = createLookupCrud({
  delegate: prisma.carFeature,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Feature not found",
});
