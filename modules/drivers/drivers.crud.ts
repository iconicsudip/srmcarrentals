import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional().or(z.literal("")),
  licenseNumber: z.string().min(1).max(60),
  licenseExpiry: z.coerce.date(),
  address: z.string().max(300).optional().or(z.literal("")),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "INACTIVE"]).optional().default("AVAILABLE"),
});
const updateSchema = createSchema.partial();

export const driversCrud = createLookupCrud({
  delegate: prisma.driver,
  createSchema,
  updateSchema,
  searchFields: ["firstName", "lastName", "phone", "licenseNumber"],
  notFoundMessage: "Driver not found",
});
