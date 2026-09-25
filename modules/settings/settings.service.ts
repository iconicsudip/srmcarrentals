import { prisma } from "@/lib/prisma";
import type { AvailableServicesConfig } from "./site-content.schemas";

export const DEFAULT_AVAILABLE_SERVICES: AvailableServicesConfig = {
  cars: true,
  taxi: true,
  tours: true,
};

function groupOf(key: string): string {
  return key.split(".")[0] ?? "general";
}

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return (row?.value as T | undefined) ?? null;
  } catch (err) {
    // DB unreachable (P1001), connection pool exhausted, etc. — return null
    // so callers fall back to their hardcoded defaults instead of crashing.
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
    taxi: row?.taxi ?? true,
    tours: row?.tours ?? true,
  };
}

