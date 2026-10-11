/**
 * The text Razorpay shows on the payment page and puts into the SMS / e-mail it sends the customer
 * (link message and payment receipt). Carries everything the customer needs after paying.
 */
export interface BookingMessageInput {
  bookingReference: string;
  carName: string;
  pickupAt: Date | string;
  dropAt: Date | string;
  pickupPlace?: string | null;
  dropPlace?: string | null;
  advanceAmount: number;
  /** Rental balance still to pay at handover (excluding the refundable deposit). */
  balanceAmount: number;
  depositAmount?: number;
  advancePercent?: number;
  bookingUrl: string;
  supportPhone?: string;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const when = (d: Date | string) =>
  new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export function buildBookingDescription(b: BookingMessageInput): string {
  const lines = [
    `SRM Car Rentals — Booking ${b.bookingReference}`,
    `Car: ${b.carName}`,
    `Pickup: ${when(b.pickupAt)}${b.pickupPlace ? ` · ${b.pickupPlace}` : ""}`,
    `Return: ${when(b.dropAt)}${b.dropPlace ? ` · ${b.dropPlace}` : ""}`,
    `Paying now${b.advancePercent ? ` (${b.advancePercent}% advance)` : ""}: ${inr(b.advanceAmount)}`,
    `Balance at handover: ${inr(b.balanceAmount)}${b.depositAmount ? ` + refundable deposit ${inr(b.depositAmount)}` : ""}`,
    `Your booking & voucher: ${b.bookingUrl}`,
    b.supportPhone ? `Help: ${b.supportPhone}` : "",
    "Carry your original driving licence and a government photo ID at pickup.",
  ].filter(Boolean);
  return lines.join("\n").slice(0, 1500);
}
