import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { AvailableServicesConfig } from "./site-content.schemas";

export const DEFAULT_AVAILABLE_SERVICES: AvailableServicesConfig = {
  cars: true,
  taxi: false,
  tours: false,
};

function groupOf(key: string): string {
  return key.split(".")[0] ?? "general";
}

// Small site/config groups read repeatedly during SSR; fetched together once per request
// to collapse ~10 sequential Neon round-trips into a single query (large/unbounded groups
// like per-booking details or enquiry lists still use single-key lookups).
const BATCHED_GROUPS = new Set(["homepage", "pages", "system", "integrations", "seo"]);

const getPublicSettingsMap = cache(async (): Promise<Map<string, unknown> | null> => {
  try {
    const rows = await prisma.setting.findMany({
      where: { group: { in: Array.from(BATCHED_GROUPS) } },
      select: { key: true, value: true },
    });
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch (err) {
    // DB unreachable (P1001), connection pool exhausted, etc. — return null
    // so callers fall back to their hardcoded defaults instead of crashing.
    console.warn("[getPublicSettingsMap] DB unavailable:", (err as Error).message);
    return null;
  }
});

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  if (BATCHED_GROUPS.has(groupOf(key))) {
    const map = await getPublicSettingsMap();
    if (!map) return null;
    return (map.get(key) as T | undefined) ?? null;
  }
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return (row?.value as T | undefined) ?? null;
  } catch (err) {
    console.warn(`[getSetting] DB unavailable for key "${key}":`, (err as Error).message);
    return null;
  }
}

export async function setSetting(key: string, value: unknown) {
  return prisma.setting.upsert({
    where: { key },
    create: { key, value: value as object, group: groupOf(key) },
    update: { value: value as object },
  });
}

export async function getAvailableServices(): Promise<AvailableServicesConfig> {
  const row = await getSetting<Partial<AvailableServicesConfig>>("system.services");
  return {
    cars: row?.cars ?? true,
    taxi: row?.taxi ?? false,
    tours: row?.tours ?? false,
  };
}

