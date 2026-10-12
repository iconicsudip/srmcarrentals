/**
 * Pickup → drop charges. A charge can be set for any pair of locations (same city or a different city).
 * Pairs without their own charge fall back to the drop location's own "drop charge" (Locations page).
 * Client-safe (pure).
 */
export type RouteCharges = Record<string, number>;

export const routeKey = (fromId: string, toId: string) => `${fromId}>${toId}`;

export function resolveDropCharge(
  routes: RouteCharges | undefined,
  fromId: string | null | undefined,
  to: { id: string; dropCharge?: unknown } | null | undefined,
): number {
  if (!to) return 0;
  const own = fromId ? routes?.[routeKey(fromId, to.id)] : undefined;
  if (own != null && Number.isFinite(own)) return Math.max(0, own);
  const n = Number(to.dropCharge ?? 0);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function normalizeRouteCharges(raw: unknown): RouteCharges {
  const out: RouteCharges = {};
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const n = Number(v);
      if (/^[^>]+>[^>]+$/.test(k) && Number.isFinite(n) && n >= 0) out[k] = Math.round(n * 100) / 100;
    }
  }
  return out;
}
