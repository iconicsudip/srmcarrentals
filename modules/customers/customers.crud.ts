import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(1).max(20),
  accountStatus: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional().default("ACTIVE"),
});
const updateSchema = createSchema.partial();

export const customersCrud = createLookupCrud({
  delegate: prisma.customer,
  createSchema,
  updateSchema,
  searchFields: ["firstName", "lastName", "email", "phone"],
  notFoundMessage: "Customer not found",
});
