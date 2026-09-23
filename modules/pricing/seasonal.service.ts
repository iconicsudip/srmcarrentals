import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { createSeasonalPricingSchema, updateSeasonalPricingSchema } from "@/modules/pricing/seasonal.schemas";

export const seasonalPricingCrud = createLookupCrud({
  delegate: prisma.seasonalPricing,
  createSchema: createSeasonalPricingSchema,
  updateSchema: updateSeasonalPricingSchema,
  searchFields: ["name"],
  orderBy: { startDate: "desc" },
  include: { car: true, carCategory: true, carType: true },
  notFoundMessage: "Seasonal pricing rule not found",
});
