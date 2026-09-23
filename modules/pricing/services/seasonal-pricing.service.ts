import { SeasonalAdjustmentType } from "@srm/types";
import { roundCurrency } from "@srm/utils";

import { prisma } from "@/lib/prisma";

export interface SeasonalAdjustmentInput {
  type: SeasonalAdjustmentType;
  value: number;
}

/**
 * Adjustment example from the spec:
 *   Christmas Season, 20 Dec - 31 Dec, Increase = 20% (PERCENTAGE_INCREASE)
 *   -> adjustment = rentalBasePrice * 0.20
 *
 * Applied to the rental base price (not extra-hour/KM/airport charges).
 * Discount types return a negative adjustment so callers can just add it.
 */
export function calculateSeasonalAdjustment(basePrice: number, adjustment: SeasonalAdjustmentInput | null): number {
  if (!adjustment) return 0;

  switch (adjustment.type) {
    case SeasonalAdjustmentType.FIXED_INCREASE:
      return roundCurrency(adjustment.value);
    case SeasonalAdjustmentType.PERCENTAGE_INCREASE:
      return roundCurrency((basePrice * adjustment.value) / 100);
    case SeasonalAdjustmentType.FIXED_DISCOUNT:
      return roundCurrency(-adjustment.value);
    case SeasonalAdjustmentType.PERCENTAGE_DISCOUNT:
      return roundCurrency(-((basePrice * adjustment.value) / 100));
    default:
      return 0;
  }
}

/** Finds the single most-specific active seasonal rule covering `date`:
 * car-specific > category-specific > type-specific > applies-to-all. */
export async function findApplicableSeasonalPricing(params: {
  carId: string;
  categoryId: string;
  carTypeId: string;
  date: Date;
}) {
  const rules = await prisma.seasonalPricing.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: params.date },
      endDate: { gte: params.date },
      OR: [
        { appliesToAll: true },
        { carId: params.carId },
        { carCategoryId: params.categoryId },
        { carTypeId: params.carTypeId },
      ],
    },
  });

  return (
    rules.find((r) => r.carId === params.carId) ??
    rules.find((r) => r.carCategoryId === params.categoryId) ??
    rules.find((r) => r.carTypeId === params.carTypeId) ??
    rules.find((r) => r.appliesToAll) ??
    null
  );
}
