/**
 * Booking enquiries collected from the "Book on WhatsApp" form on car cards.
 * Stored in the `Setting` table (same approach as taxi enquiries), so no migration is needed.
 */
export const CAR_ENQUIRIES_SETTING_KEY = "cars.enquiries";
export const MAX_STORED_CAR_ENQUIRIES = 2000;

export type CarEnquiryStatus = "NEW" | "CONTACTED" | "CONFIRMED" | "CANCELLED";

export interface CarEnquiry {
  id: string;
  carId: string;
  carSlug?: string;
  carName: string;
  name: string;
  phone: string;
  email?: string;
  pickupAt?: string;
  dropAt?: string;
  pickupLocation?: string;
  notes?: string;
  source: "CAR_CARD_WHATSAPP";
  status: CarEnquiryStatus;
  createdAt: string;
}

/** Digits only, capped at 10 (drops a pasted +91 / leading 0 prefix). */
export function toTenDigits(value: string): string {
  let digits = value.replace(/[^0-9]/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}
