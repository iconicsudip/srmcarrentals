/**
 * Everything the customer entered / selected at checkout that has no dedicated column on `Booking`.
 * Stored per booking in the `Setting` table (key below) so no migration is required, and read back
 * only through the permission-protected admin booking endpoint.
 */
export const bookingDetailsKey = (bookingReference: string) => `booking.details.${bookingReference}`;

export interface BookingCheckoutDetails {
  customer: {
    licenseNumber?: string;
    /** Stored masked (last 4 digits only) — never the full Aadhaar number. */
    aadhaarMasked?: string;
    city?: string;
    email?: string;
    emailProvided: boolean;
    hasValidLicense: boolean;
    agreedToTerms: boolean;
  };
  selection: {
    rentalMode?: "DAILY" | "HOURLY";
    kmLimit?: number;
    extraKmPrice?: number;
    deliveryType?: "BRANCH" | "AIRPORT" | "DOORSTEP";
    locationLabel?: string;
    durationText?: string;
    insuranceName?: string;
    extraServiceNames?: string[];
    couponCode?: string;
    securityDeposit?: number;
  };
  payment: {
    method: "PICKUP" | "ONLINE";
    grandTotal?: number;
    payableNow?: number;
    payableLater?: number;
  };
  capturedAt: string;
}

export function maskAadhaar(value?: string): string | undefined {
  const digits = (value ?? "").replace(/[^0-9]/g, "");
  return digits.length >= 4 ? `XXXX-XXXX-${digits.slice(-4)}` : undefined;
}
