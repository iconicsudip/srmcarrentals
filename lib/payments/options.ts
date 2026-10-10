import { getSetting } from "@/modules/settings/settings.service";
import { DEFAULT_PAYMENT_OPTIONS, type PaymentOptions } from "@/lib/payments/types";

interface PaymentSetting {
  enablePayOnPickup?: boolean;
  enableRazorpay?: boolean;
  allowUpiOnPickup?: boolean;
  allowCashOnPickup?: boolean;
  advancePercent?: number;
  defaultSecurityDeposit?: number;
}

/** Reads the admin payment settings and returns only what the storefront may see. */
export async function getPaymentOptions(): Promise<PaymentOptions> {
  const s = await getSetting<PaymentSetting>("system.payment");
  const d = DEFAULT_PAYMENT_OPTIONS;
  const pct = Number(s?.advancePercent);
  const dep = Number(s?.defaultSecurityDeposit);
  const opts: PaymentOptions = {
    enablePayOnPickup: s?.enablePayOnPickup ?? d.enablePayOnPickup,
    enableOnline: s?.enableRazorpay ?? d.enableOnline,
    allowUpiOnPickup: s?.allowUpiOnPickup ?? d.allowUpiOnPickup,
    allowCashOnPickup: s?.allowCashOnPickup ?? d.allowCashOnPickup,
    advancePercent: Number.isFinite(pct) && pct >= 1 && pct <= 100 ? pct : d.advancePercent,
    securityDeposit: Number.isFinite(dep) && dep >= 0 ? dep : d.securityDeposit,
  };
  // Never leave customers with no way to book.
  if (!opts.enablePayOnPickup && !opts.enableOnline) opts.enablePayOnPickup = true;
  return opts;
}
