import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  customerName: z.string().min(1).max(120),
  location: z.string().max(120).optional().or(z.literal("")),
  avatarUrl: z.string().optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  quote: z.string().min(1).max(1000),
  bookedItem: z.string().max(160).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().optional().default(0),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
const updateSchema = createSchema.partial();

export const testimonialsCrud = createLookupCrud({
  delegate: prisma.testimonial,
  createSchema,
  updateSchema,
  searchFields: ["customerName", "quote"],
  orderBy: { sortOrder: "asc" },
  notFoundMessage: "Testimonial not found",
});
