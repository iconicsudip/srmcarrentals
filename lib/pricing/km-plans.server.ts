import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/modules/settings/settings.service";
import { DEFAULT_KM_PLANS, normalizeKmPlans, resolveCarKmPlans, type KmPlansConfig } from "@/lib/pricing/km-plans";

export const KM_PLANS_SETTING_KEY = "pricing.km_plans";

export async function getKmPlansConfig(): Promise<KmPlansConfig> {
  try {
    return normalizeKmPlans(await getSetting<unknown>(KM_PLANS_SETTING_KEY));
  } catch {
    return DEFAULT_KM_PLANS;
  }
}

/**
 * Admin sets location prices per CITY, but customers pick a pickup POINT inside it. This copies each city's
 * prices onto that city's points (a price set on a point itself still wins), so lookups by pickup point match.
 */
export async function getKmPlansConfigForPickup(): Promise<KmPlansConfig> {
  const cfg = await getKmPlansConfig();
  const byCar = cfg.locationPrices;
  if (!byCar || Object.keys(byCar).length === 0) return cfg;
  const locs = await prisma.location.findMany({ select: { id: true, kind: true, city: true } });
  const cityOf = new Map(locs.map((l) => [l.id, (l.city ?? "").trim().toLowerCase()]));
  const expanded: NonNullable<KmPlansConfig["locationPrices"]> = {};
  for (const [carId, byLoc] of Object.entries(byCar)) {
    const out = { ...byLoc };
    for (const [locId, plans] of Object.entries(byLoc)) {
      const loc = locs.find((l) => l.id === locId);
      if (!loc || loc.kind !== "CITY") continue;
      const city = cityOf.get(locId);
      for (const pt of locs) if (pt.kind !== "CITY" && cityOf.get(pt.id) === city && !out[pt.id]) out[pt.id] = plans;
    }
    expanded[carId] = out;
  }
  return { ...cfg, locationPrices: expanded };
}

export async function saveKmPlansConfig(raw: unknown): Promise<KmPlansConfig> {
  const cfg = normalizeKmPlans(raw);
  await setSetting(KM_PLANS_SETTING_KEY, cfg);
  return cfg;
}

/**
 * Saves the KM plan prices (daily + hourly for each KM plan) of the given cars — or of every car when no ids
 * are given — so they are real, editable values by default. Prices an admin already set are never changed.
 * Returns how many cars were updated.
 */
export async function materializeKmPlanPrices(carIds?: string[]): Promise<number> {
  const cars = await prisma.car.findMany({
    where: { ...(carIds ? { id: { in: carIds } } : {}), pricing: { isNot: null } },
    select: { id: true, pricing: { select: { dailyPrice: true, hourlyPrice: true, includedKmPerDay: true, extraKmPrice: true } } },
  });
  if (cars.length === 0) return 0;
  const cfg = await getKmPlansConfig();
  let changed = 0;
  for (const car of cars) {
    const p = car.pricing!;
    const plans = resolveCarKmPlans(
      {
        id: car.id,
        dailyPrice: Number(p.dailyPrice),
        hourlyPrice: p.hourlyPrice != null ? Number(p.hourlyPrice) : null,
        includedKmPerDay: p.includedKmPerDay,
        extraKmPrice: Number(p.extraKmPrice),
      },
      { tiers: cfg.tiers, prices: {} },
    );
    const mine = { ...(cfg.prices[car.id] ?? {}) };
    let touched = false;
    for (const plan of plans) {
      const cur = { ...(mine[String(plan.km)] ?? {}) };
      if (cur.daily == null && plan.dailyPrice > 0) { cur.daily = plan.dailyPrice; touched = true; }
      if (cur.hourly == null && plan.hourlyPrice != null && plan.hourlyPrice > 0) { cur.hourly = plan.hourlyPrice; touched = true; }
      mine[String(plan.km)] = cur;
    }
    if (touched) { cfg.prices[car.id] = mine; changed++; }
  }
  if (changed > 0) await setSetting(KM_PLANS_SETTING_KEY, cfg);
  return changed;
}
