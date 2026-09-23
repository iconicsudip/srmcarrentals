import { TaxType } from "@srm/types";
import { roundCurrency } from "@srm/utils";

import { prisma } from "@/lib/prisma";

export interface TaxInput {
  name: string;
  type: TaxType;
  /** For PERCENTAGE taxes this is a percent (e.g. 18 for 18% GST); for FIXED taxes it's a flat amount. */
  percentage: number;
}

export interface TaxResult {
  name: string;
  percentage: number;
  amount: number;
}

/** GST-style example from the spec: Subtotal ₹5950 * 18% = ₹1071. */
export function calculateTax(subtotal: number, tax: TaxInput | null): TaxResult {
  if (!tax) return { name: "Tax", percentage: 0, amount: 0 };

  const amount = tax.type === TaxType.PERCENTAGE ? (subtotal * tax.percentage) / 100 : tax.percentage;

  return { name: tax.name, percentage: tax.type === TaxType.PERCENTAGE ? tax.percentage : 0, amount: roundCurrency(amount) };
}

/** Admin-configurable default tax (Settings > Tax Settings manages the
 * `isDefault` flag on the active Tax row — see taxes.crud for the CRUD API). */
export function findDefaultTax() {
  return prisma.tax.findFirst({ where: { status: "ACTIVE", isDefault: true } });
}
