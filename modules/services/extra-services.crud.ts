import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { nameStatusSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = nameStatusSchema({
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.coerce.number().nonnegative(),
  pricingType: z.enum(["PER_BOOKING", "PER_DAY", "PER_HOUR"]),
});

export const extraServicesCrud = createLookupCrud({
  delegate: prisma.extraService,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Extra service not found",
});
