/**
 * KM plans for a 24-hour rental. Every plan is priced exactly as the pricing engine would price
 * it — base 24h price + (extra KM pre-bought × the car's extra-KM rate) — so the car card, the
 * car page and the final booking always show the same numbers.
 */
export interface KmTier {
  /** Multiplier of the included KM (1 = the car's standard plan). */
  plan: 1 | 2 | 3;
  /** KM allowed per 24 hours. */
  kmPerDay: number;
  /** Price per 24 hours for this plan. */
  pricePerDay: number;
  isPopular: boolean;
}

export function buildKmTiers(input: { dailyPrice: number; includedKmPerDay: number; extraKmPrice: number }): KmTier[] {
  const base = Math.max(1, Math.round(input.includedKmPerDay || 0));
  const extra = Math.max(0, input.extraKmPrice || 0);
  return ([1, 2, 3] as const).map((plan) => ({
    plan,
    kmPerDay: base * plan,
    pricePerDay: Math.round(input.dailyPrice + (plan - 1) * base * extra),
    isPopular: plan === 2,
  }));
}

export const clampKmPlan = (n: number): 1 | 2 | 3 => (n >= 3 ? 3 : n >= 2 ? 2 : 1);
