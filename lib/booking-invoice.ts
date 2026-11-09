/** Builds the line-by-line price breakdown and payment summary shown on the booking page and the invoice. */

type Num = string | number | null | undefined;
const n = (v: Num) => (v == null || v === "" ? 0 : Number(v));

export interface BreakdownLine {
  label: string;
  /** Small explanation under the label, e.g. "5 days × ₹2,760". */
  detail?: string;
  amount: number;
  /** Shown as "Free" instead of ₹0. */
  freeWhenZero?: boolean;
  kind?: "charge" | "discount" | "subtotal" | "total" | "section";
}

export interface PaymentLine {
  date: string | null;
  method: string;
  type: string;
  status: string;
  amount: number;
}

export interface InvoiceModel {
  reference: string;
  invoiceNumber: string;
  issuedAt: string;
  status: string;
  customer: { name: string; phone: string; email: string };
  car: string;
  pickup: { when: string; place: string };
  drop: { when: string; place: string };
  duration: string;
  lines: BreakdownLine[];
  grandTotal: number;
  payments: PaymentLine[];
  paidTotal: number;
  balanceDue: number;
  securityDeposit: number | null;
  quotedAtCheckout: number | null;
}

const inr = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const place = (kind: "pickup" | "drop", b: any): string => {
  const isAirport = kind === "pickup" ? b.pickupIsAirport : b.dropIsAirport;
  const airport = kind === "pickup" ? b.pickupAirport : b.dropAirport;
  const loc = kind === "pickup" ? b.pickupLocation : b.dropLocation;
  if (isAirport && airport) {
    const hasCode = !airport.code || String(airport.name).includes(`(${airport.code})`);
    return hasCode ? airport.name : `${airport.name} (${airport.code})`;
  }
  if (loc) return [loc.name, loc.city && loc.city !== loc.name ? loc.city : null].filter(Boolean).join(", ");
  return "—";
};

export function buildInvoiceModel(b: any): InvoiceModel {
  const s = b.pricingSnapshot ?? {};
  const details = b.checkoutDetails ?? null;
  const pickupPlace = place("pickup", b);
  const dropPlace = place("drop", b);

  const days = n(s.fullDays);
  const extraHours = n(s.extraHours);
  const extraHourPrice = n(s.extraHourPrice);
  const serviceNames: string[] = details?.selection?.extraServiceNames ?? [];

  const lines: BreakdownLine[] = [
    { label: "Rental", detail: `${days || 1} day${days > 1 ? "s" : ""} × ${inr(n(s.dailyPrice))}`, amount: n(s.rentalPrice) },
  ];
  if (n(s.extraHourCharge) > 0 || extraHours > 0) {
    lines.push({ label: "Extra hours", detail: `${extraHours} hr × ${inr(extraHourPrice)}`, amount: n(s.extraHourCharge) });
  }
  if (n(s.extraKmCharge) > 0) lines.push({ label: "Extra KM", detail: `${inr(n(s.extraKmPrice))} per km beyond the included limit`, amount: n(s.extraKmCharge) });

  lines.push({ label: "Pickup & drop", amount: 0, kind: "section" });
  lines.push({
    label: "Pickup charge",
    detail: pickupPlace,
    amount: n(s.airportPickupCharge),
    freeWhenZero: true,
  });
  lines.push({
    label: "Drop charge",
    detail: `${dropPlace}${n(s.airportDropCharge) > 0 && n(s.locationDropCharge) > 0 ? " (airport + location fee)" : ""}`,
    amount: n(s.airportDropCharge) + n(s.locationDropCharge),
    freeWhenZero: true,
  });

  if (n(s.seasonalAdjustment) !== 0) lines.push({ label: "Seasonal adjustment", amount: n(s.seasonalAdjustment) });
  if (n(s.servicesTotal) > 0) lines.push({ label: "Extra services", detail: serviceNames.join(", ") || undefined, amount: n(s.servicesTotal) });
  if (n(s.insuranceCharge) > 0) lines.push({ label: "Insurance / protection", amount: n(s.insuranceCharge) });
  if (n(s.discount) > 0) lines.push({ label: "Discount", detail: s.couponCode ? `Code ${s.couponCode}` : undefined, amount: -n(s.discount), kind: "discount" });

  lines.push({ label: "Subtotal", amount: n(s.subtotal), kind: "subtotal" });
  lines.push({ label: `Tax (GST ${n(s.taxPercentage)}%)`, amount: n(s.taxAmount) });
  lines.push({ label: "Grand total", amount: n(s.grandTotal), kind: "total" });

  // One real payment can be stored twice (webhook retries) — count it once.
  const rows: any[] = Array.isArray(b.payments) ? b.payments : [];
  const unique = rows.filter((p, i) => !p.providerPaymentId || rows.findIndex((x) => x.providerPaymentId === p.providerPaymentId) === i);
  const payments: PaymentLine[] = unique.map((p) => ({
    date: p.paidAt ?? null,
    method: p.provider,
    type: p.paymentType,
    status: p.status,
    amount: n(p.amount),
  }));
  const paidTotal = payments.filter((p) => p.status === "PAID" || p.status === "PARTIALLY_PAID").reduce((a, p) => a + p.amount, 0);
  const grandTotal = n(s.grandTotal);
  const quoted = details?.payment?.grandTotal != null ? n(details.payment.grandTotal) : null;

  const hours = n(s.totalHours);
  return {
    reference: b.bookingReference,
    invoiceNumber: `INV-${b.bookingReference}`,
    issuedAt: b.createdAt,
    status: b.status,
    customer: {
      name: `${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}`.trim(),
      phone: b.customer?.phone ?? "",
      email: b.customer?.email ?? "",
    },
    car: [b.car?.brand?.name, b.car?.model?.name].filter(Boolean).join(" ") || b.car?.name || "",
    pickup: { when: b.pickupDateTime, place: pickupPlace },
    drop: { when: b.dropDateTime, place: dropPlace },
    duration: hours ? `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h (${hours} hrs)` : "",
    lines,
    grandTotal,
    payments,
    paidTotal,
    balanceDue: Math.max(0, Math.round((grandTotal - paidTotal) * 100) / 100),
    securityDeposit: details?.selection?.securityDeposit != null ? n(details.selection.securityDeposit) : null,
    quotedAtCheckout: quoted != null && Math.abs(quoted - grandTotal) > 0.5 ? quoted : null,
  };
}

export const formatMoney = inr;
