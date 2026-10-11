import { getSetting, setSetting } from "@/modules/settings/settings.service";
import { DEFAULT_KM_PLANS, normalizeKmPlans, type KmPlansConfig } from "@/lib/pricing/km-plans";

export const KM_PLANS_SETTING_KEY = "pricing.km_plans";

export async function getKmPlansConfig(): Promise<KmPlansConfig> {
  try {
    return normalizeKmPlans(await getSetting<unknown>(KM_PLANS_SETTING_KEY));
  } catch {
    return DEFAULT_KM_PLANS;
  }
}

export async function saveKmPlansConfig(raw: unknown): Promise<KmPlansConfig> {
  const cfg = normalizeKmPlans(raw);
  await setSetting(KM_PLANS_SETTING_KEY, cfg);
  return cfg;
}
