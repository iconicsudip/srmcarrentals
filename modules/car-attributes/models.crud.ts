import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { namedLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = namedLookupSchema({
  brandId: z.string().min(1),
});

export const modelsCrud = createLookupCrud({
  delegate: prisma.carModel,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  include: { brand: true },
  buildWhere: (url) => {
    const brandId = url.searchParams.get("brandId");
    return brandId ? { brandId } : {};
  },
  notFoundMessage: "Model not found",
});
