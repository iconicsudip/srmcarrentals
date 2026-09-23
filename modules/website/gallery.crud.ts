import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  imageUrl: z.string().min(1),
  caption: z.string().max(200).optional().or(z.literal("")),
  link: z.string().max(300).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().optional().default(0),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
const updateSchema = createSchema.partial();

export const galleryCrud = createLookupCrud({
  delegate: prisma.galleryImage,
  createSchema,
  updateSchema,
  orderBy: { sortOrder: "asc" },
  notFoundMessage: "Gallery image not found",
});
