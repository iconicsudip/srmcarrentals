import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { nameStatusSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = nameStatusSchema({
  hexCode: z.string().max(20).optional(),
});

export const colorsCrud = createLookupCrud({
  delegate: prisma.carColor,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Color not found",
});
