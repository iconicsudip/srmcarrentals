import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";

const couponSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(30)
    .transform((c) => c.trim().toUpperCase()),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  percentage: z.coerce.number().min(0).max(100).nullable().optional(),
  fixedAmount: z.coerce.number().min(0).nullable().optional(),
  maxDiscount: z.coerce.number().min(0).nullable().optional(),
  minBookingAmount: z.coerce.number().min(0).nullable().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  usageLimit: z.coerce.number().int().min(1).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const couponsCrud = createLookupCrud({
  delegate: prisma.coupon,
  createSchema: couponSchema,
  updateSchema: couponSchema.partial(),
  searchFields: ["code"],
  notFoundMessage: "Coupon not found",
  orderBy: { createdAt: "desc" },
});
