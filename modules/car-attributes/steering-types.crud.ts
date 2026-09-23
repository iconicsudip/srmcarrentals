import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { nameStatusSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = nameStatusSchema();

export const steeringTypesCrud = createLookupCrud({
  delegate: prisma.steeringType,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Steering type not found",
});
