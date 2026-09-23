import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  label: z.string().min(1).max(120),
  luggageCapacity: z.string().max(60).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
const updateSchema = createSchema.partial();

export const capacityCrud = createLookupCrud({
  delegate: prisma.carCapacity,
  createSchema,
  updateSchema,
  searchFields: ["label"],
  notFoundMessage: "Car capacity not found",
});
