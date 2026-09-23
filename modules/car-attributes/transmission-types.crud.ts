import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { nameStatusSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = nameStatusSchema();

export const transmissionTypesCrud = createLookupCrud({
  delegate: prisma.transmissionType,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Transmission type not found",
});
