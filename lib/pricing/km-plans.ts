/**
 * KM plans: the same 3 KM allowances for every car (default 120 / 240 / 350 km per 24 hours),
 * with a daily (24h) and hourly price per car per plan. Anything an admin hasn't set explicitly is
 * calculated from the car's own pricing, so every car works out of the box.
 *
 * Client-safe (pure) — the config itself is stored by Admin → Locations & Pricing → KM Plans.
 */
export interface KmPlanPrice {
  /** Price per 24 hours for this plan. */
  daily?: number;
  /** Price per hour for this plan (hourly rentals). */
  hourly?: number;
}

export interface KmPlansConfig {
  /** KM allowed per 24 hours for plans 1–3. */
  tiers: [number, number, number];
  /** carId → km → price overrides. */
  prices: Record<string, Record<string, KmPlanPrice>>;
}

export const DEFAULT_KM_PLANS: KmPlansConfig = { tiers: [120, 240, 350], prices: {} };

export interface CarKmPlan {
  plan: 1 | 2 | 3;
  /** KM allowed per 24 hours. */
  km: number;
  dailyPrice: number;
  /** null when the car has no hourly rental. */
  hourlyPrice: number | null;
  isPopular: boolean;
  /** true when an admin set an explicit price for this car/plan. */
  custom: boolean;
}

export interface KmPlanCarInput {
  id: string;
  dailyPrice: number;
  hourlyPrice?: number | null;
  includedKmPerDay: number;
  extraKmPrice: number;
}

export function normalizeKmPlans(raw: unknown): KmPlansConfig {
  const r = (raw ?? {}) as Partial<KmPlansConfig>;
  const t = Array.isArray(r.tiers) ? r.tiers.map((n) => Math.max(1, Math.round(Number(n) || 0))) : [];
  const tiers: [number, number, number] =
    t.length === 3 && t.every((n) => n > 0) ? [t[0]!, t[1]!, t[2]!] : DEFAULT_KM_PLANS.tiers;
  const prices: KmPlansConfig["prices"] = {};
  if (r.prices && typeof r.prices === "object") {
    for (const [carId, byKm] of Object.entries(r.prices)) {
      if (!byKm || typeof byKm !== "object") continue;
      for (const [km, p] of Object.entries(byKm)) {
        const daily = Number(p?.daily);
        const hourly = Number(p?.hourly);
        const entry: KmPlanPrice = {};
        if (Number.isFinite(daily) && daily > 0) entry.daily = daily;
        if (Number.isFinite(hourly) && hourly > 0) entry.hourly = hourly;
        if (entry.daily != null || entry.hourly != null) (prices[carId] ??= {})[km] = entry;
      }
    }
  }
  return { tiers, prices };
}

/** The 3 plans for a car: explicit admin prices first, otherwise calculated from the car's own rates. */
export function resolveCarKmPlans(car: KmPlanCarInput, config: KmPlansConfig = DEFAULT_KM_PLANS): CarKmPlan[] {
  return config.tiers.map((km, i) => {
    const override = config.prices[car.id]?.[String(km)];
    const calculated = Math.round(car.dailyPrice + Math.max(0, km - car.includedKmPerDay) * (car.extraKmPrice || 0));
    const hourlyBase = car.hourlyPrice && car.hourlyPrice > 0 ? car.hourlyPrice : null;
    return {
      plan: (i + 1) as 1 | 2 | 3,
      km,
      dailyPrice: override?.daily ?? calculated,
      hourlyPrice: override?.hourly ?? hourlyBase,
      isPopular: i === 1,
      custom: override?.daily != null || override?.hourly != null,
    };
  });
}

export const clampPlan = (n: number): 1 | 2 | 3 => (n >= 3 ? 3 : n >= 2 ? 2 : 1);
