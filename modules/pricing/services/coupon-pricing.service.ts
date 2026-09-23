import { CouponDiscountType } from "@srm/types";
import { roundCurrency } from "@srm/utils";

import { prisma } from "@/lib/prisma";

export interface CouponInput {
  discountType: CouponDiscountType;
  percentage?: number | null;
  fixedAmount?: number | null;
  maxDiscount?: number | null;
  minBookingAmount?: number | null;
  startDate: Date;
  endDate: Date;
  usageLimit?: number | null;
  usedCount: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  reason?: string;
}

/** Validates a coupon against date range / usage limit / minimum booking
 * amount, then computes the discount — percentage discounts respect
 * `maxDiscount`, and no coupon can discount more than the subtotal itself. */
export function validateAndCalculateCoupon(
  coupon: CouponInput | null,
  subtotal: number,
  now: Date = new Date(),
): CouponValidationResult {
  if (!coupon) return { valid: false, discount: 0, reason: "Coupon not found" };
  if (coupon.status !== "ACTIVE") return { valid: false, discount: 0, reason: "Coupon is inactive" };
  if (now < coupon.startDate || now > coupon.endDate) {
    return { valid: false, discount: 0, reason: "Coupon is not valid at this time" };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, reason: "Coupon usage limit has been reached" };
  }
  if (coupon.minBookingAmount != null && subtotal < coupon.minBookingAmount) {
    return { valid: false, discount: 0, reason: `Minimum booking amount of ₹${coupon.minBookingAmount} not met` };
  }

  let discount =
    coupon.discountType === CouponDiscountType.PERCENTAGE
      ? (subtotal * (coupon.percentage ?? 0)) / 100
      : (coupon.fixedAmount ?? 0);

  if (coupon.discountType === CouponDiscountType.PERCENTAGE && coupon.maxDiscount != null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, subtotal);

  return { valid: true, discount: roundCurrency(discount) };
}

export function findCouponByCode(code: string) {
  return prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
}
