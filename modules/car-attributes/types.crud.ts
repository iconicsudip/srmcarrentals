import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { namedLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = namedLookupSchema();

export const typesCrud = createLookupCrud({
  delegate: prisma.carType,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Car type not found",
});
