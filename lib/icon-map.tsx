import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

/** Resolves an admin-entered icon name (stored as plain text in Settings,
 * e.g. "ShieldCheck") to the matching Lucide component, so "Why Choose Us" /
 * "Built For Business" cards stay fully admin-configurable without a
 * hardcoded icon per item. Falls back to a generic sparkle if the name
 * doesn't match a known icon. */
const EMOJI_TO_ICON: Record<string, string> = {
  "🛡": "ShieldCheck", "⚡": "Zap", "🚗": "CarFront", "📞": "PhoneCall", "📍": "MapPin", "🔧": "Wrench",
  "💼": "Briefcase", "🎉": "PartyPopper", "✈": "Plane", "💬": "MessageCircle", "✉": "Mail", "📋": "ClipboardList",
  "📅": "CalendarDays", "🚚": "Truck", "⛽": "Fuel", "⭐": "Star", "💰": "Wallet", "🏙": "Building2",
};

export function resolveIcon(name: string | undefined | null): LucideIcon {
  if (!name) return Sparkles;
  // Older content may hold an emoji — show the matching icon instead
  const mapped = EMOJI_TO_ICON[Array.from(name.trim())[0] ?? ""];
  if (mapped) name = mapped;
  const icon = (Icons as unknown as Record<string, LucideIcon>)[name];
  return typeof icon === "function" || typeof icon === "object" ? icon : Sparkles;
}
