import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { countLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = countLookupSchema();

export const doorsCrud = createLookupCrud({
  delegate: prisma.carDoorOption,
  createSchema,
  updateSchema,
  orderBy: { count: "asc" },
  notFoundMessage: "Door option not found",
});
