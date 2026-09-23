import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { countLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = countLookupSchema();

export const seatsCrud = createLookupCrud({
  delegate: prisma.carSeatOption,
  createSchema,
  updateSchema,
  orderBy: { count: "asc" },
  notFoundMessage: "Seat option not found",
});
