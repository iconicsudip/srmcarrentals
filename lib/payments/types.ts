/** Public-safe view of Admin → Settings → Payments (no keys or secrets). */
export interface PaymentOptions {
  enablePayOnPickup: boolean;
  enableOnline: boolean;
  allowUpiOnPickup: boolean;
  allowCashOnPickup: boolean;
  /** Percentage of the rental charged up-front when paying online. */
  advancePercent: number;
  /** Refundable security deposit collected at handover. */
  securityDeposit: number;
}

export const DEFAULT_PAYMENT_OPTIONS: PaymentOptions = {
  enablePayOnPickup: true,
  enableOnline: true,
  allowUpiOnPickup: true,
  allowCashOnPickup: true,
  advancePercent: 30,
  securityDeposit: 3000,
};
