import type { CartItem } from "@/lib/cart/cart-store";

/** "1 day + 2 hrs" style label from the pricing engine's split (whole days + leftover hours). */
export function tripSplitLabel(item: Pick<CartItem, "fullDays" | "durationDays" | "extraHours">): string {
  const days = Math.max(item.fullDays ?? item.durationDays ?? 1, 1);
  const hrs = item.extraHours ?? 0;
  return `${days} ${days === 1 ? "day" : "days"}${hrs > 0 ? ` + ${hrs} ${hrs === 1 ? "hr" : "hrs"}` : ""}`;
}

/** KM allowance explained: "240km × 1 day + 2 hrs" (extra hours earn KM pro-rata). */
export function includedKmLabel(item: Pick<CartItem, "includedKm" | "fullDays" | "durationDays" | "extraHours">, fallbackPerDay = 240): string {
  const days = Math.max(item.fullDays ?? item.durationDays ?? 1, 1);
  const hrs = item.extraHours ?? 0;
  const total = item.includedKm ?? Math.round(fallbackPerDay * (days + hrs / 24));
  const perDay = Math.round(total / (days + hrs / 24));
  return `${total}km (${perDay}km × ${tripSplitLabel(item)})`;
}
