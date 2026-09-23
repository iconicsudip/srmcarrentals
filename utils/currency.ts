/** Format a number as Indian Rupees, e.g. formatCurrency(7021) -> "₹7,021". */
export function formatCurrency(amount: number, currency = "INR", locale = "en-IN"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Round to 2 decimal places, avoiding floating point drift (e.g. 1071.0000000001). */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
