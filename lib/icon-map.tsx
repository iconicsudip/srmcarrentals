import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

/** Resolves an admin-entered icon name (stored as plain text in Settings,
 * e.g. "ShieldCheck") to the matching Lucide component, so "Why Choose Us" /
 * "Built For Business" cards stay fully admin-configurable without a
 * hardcoded icon per item. Falls back to a generic sparkle if the name
 * doesn't match a known icon. */
export function resolveIcon(name: string | undefined | null): LucideIcon {
  if (!name) return Sparkles;
  const icon = (Icons as unknown as Record<string, LucideIcon>)[name];
  return typeof icon === "function" || typeof icon === "object" ? icon : Sparkles;
}
