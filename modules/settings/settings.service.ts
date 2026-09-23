import { prisma } from "@/lib/prisma";

function groupOf(key: string): string {
  return key.split(".")[0] ?? "general";
}

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return (row?.value as T | undefined) ?? null;
}

export async function setSetting(key: string, value: unknown) {
  return prisma.setting.upsert({
    where: { key },
    create: { key, value: value as object, group: groupOf(key) },
    update: { value: value as object },
  });
}
