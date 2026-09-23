import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { namedLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = namedLookupSchema();

export const tourCategoriesCrud = createLookupCrud({
  delegate: prisma.tourCategory,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Tour category not found",
});
