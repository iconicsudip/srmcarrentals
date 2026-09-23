import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { nameStatusSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = nameStatusSchema();

export const fuelTypesCrud = createLookupCrud({
  delegate: prisma.fuelType,
  createSchema,
  updateSchema,
  searchFields: ["name"],
  notFoundMessage: "Fuel type not found",
});
