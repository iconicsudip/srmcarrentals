import { getSetting, setSetting } from "@/modules/settings/settings.service";
import { normalizeRouteCharges, type RouteCharges } from "@/lib/pricing/location-routes";

const KEY = "pricing.location_routes";

export async function getRouteCharges(): Promise<RouteCharges> {
  try {
    return normalizeRouteCharges(await getSetting<unknown>(KEY));
  } catch {
    return {};
  }
}

export async function saveRouteCharges(raw: unknown): Promise<RouteCharges> {
  const cleaned = normalizeRouteCharges(raw);
  await setSetting(KEY, cleaned);
  return cleaned;
}
