import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { nameStatusSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = nameStatusSchema({
  description: z.string().max(500).optional().or(z.literal("")),
  pricingType: z.enum(["FIXED", "PERCENTAGE", "DAILY"]),
  fixedPrice: z.coerce.number().nonnegative().optional(),
  percentagePrice: z.coerce.number().nonnegative().optional(),
  dailyPrice: z.coerce.number().nonnegative().optional(),
});

export const insurancesCrud = createLookupCrud({
  delegate: prisma.insurance,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Insurance option not found",
});
