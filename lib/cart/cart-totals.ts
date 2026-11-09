import type { CartItem } from "@/lib/cart/cart-store";

export interface CartTotals {
  /** Rental, extra hours, services, protection — the trip itself, before fees, discount and tax. */
  subtotal: number;
  /** The pieces of `subtotal`, in display order (zero lines are left out except the rental). */
  parts: { key: string; label: string; amount: number; detail?: string }[];
  airport: number;
  dropFee: number;
  discount: number;
  tax: number;
  deposit: number;
  /** What the customer pays: every car's total (fees, discount and tax included) plus the refundable deposit. */
  grand: number;
  /** Same without the deposit. */
  rentalPayable: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * One place that adds up the cart, so the cart page, the checkout page and the drawer always agree.
 * Each car's `total` (priced by the server when it was added) is the source of truth; the lines explain it.
 */
export function cartTotals(items: CartItem[], deposit: number): CartTotals {
  let rental = 0;
  let extraHours = 0;
  let services = 0;
  let insurance = 0;
  let airport = 0;
  let dropFee = 0;
  let discount = 0;
  let tax = 0;
  let total = 0;

  for (const it of items) {
    rental += it.basePrice || it.dailyPrice || 0;
    extraHours += it.extraHourCharge ?? 0;
    services += it.servicesTotal ?? it.extraServices.reduce((s, x) => s + (x.price || 0), 0);
    insurance += it.insuranceCharge ?? it.insurance?.price ?? 0;
    airport += (it.airportPickupCharge ?? 0) + (it.airportDropCharge ?? 0);
    dropFee += it.locationDropCharge ?? 0;
    discount += it.discount ?? 0;
    tax += it.tax ?? 0;
    total += it.total ?? 0;
  }

  // Whatever the server added that the cart does not list separately (extra km, seasonal pricing, per-day add-on rates…)
  const explained = rental + extraHours + services + insurance + airport + dropFee - discount + tax;
  const other = r2(total - explained);

  const inr = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const one = items.length === 1 ? items[0]! : null;
  const days = one ? Math.max(one.fullDays ?? one.durationDays ?? 1, 1) : 0;
  const parts: CartTotals["parts"] = [
    {
      key: "rental",
      label: "Rental",
      amount: r2(rental),
      detail: one ? `${days} day${days > 1 ? "s" : ""} × ${inr(Math.round((rental / days) * 100) / 100)}` : `${items.length} cars`,
    },
    {
      key: "extraHours",
      label: "Extra hours",
      amount: r2(extraHours),
      detail: one && (one.extraHours ?? 0) > 0 && one.extraHourPrice ? `${one.extraHours} hr × ${inr(one.extraHourPrice)}` : undefined,
    },
    { key: "services", label: "Extra services", amount: r2(services), detail: items.flatMap((i) => i.extraServices.map((x) => x.name)).join(", ") || undefined },
    { key: "insurance", label: "Protection plan", amount: r2(insurance), detail: items.map((i) => i.insurance?.name).filter(Boolean).join(", ") || undefined },
    { key: "other", label: "Other charges", amount: other, detail: "Extra KM or seasonal pricing" },
  ].filter((p) => p.key === "rental" || Math.abs(p.amount) > 0.5);

  const subtotal = r2(parts.reduce((s, p) => s + p.amount, 0));
  const rentalPayable = r2(Math.max(0, total));
  return { subtotal, parts, airport: r2(airport), dropFee: r2(dropFee), discount: r2(discount), tax: r2(tax), deposit, rentalPayable, grand: r2(rentalPayable + deposit) };
}
