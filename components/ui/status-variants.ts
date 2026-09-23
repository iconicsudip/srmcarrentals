import {
  BookingStatus,
  CarStatus,
  DriverStatus,
  PaymentStatus,
  Status,
} from "@srm/types";

/** Semantic tone for a status badge; mapped to Tailwind classes by the consuming Badge component. */
export type StatusTone = "default" | "success" | "warning" | "destructive" | "info" | "muted";

export const STATUS_TONE: Record<Status, StatusTone> = {
  [Status.ACTIVE]: "success",
  [Status.INACTIVE]: "muted",
};

export const CAR_STATUS_TONE: Record<CarStatus, StatusTone> = {
  [CarStatus.DRAFT]: "muted",
  [CarStatus.ACTIVE]: "success",
  [CarStatus.INACTIVE]: "muted",
  [CarStatus.MAINTENANCE]: "warning",
};

export const BOOKING_STATUS_TONE: Record<BookingStatus, StatusTone> = {
  [BookingStatus.PENDING]: "warning",
  [BookingStatus.PAYMENT_PENDING]: "warning",
  [BookingStatus.CONFIRMED]: "info",
  [BookingStatus.DRIVER_ASSIGNED]: "info",
  [BookingStatus.OUT_FOR_PICKUP]: "info",
  [BookingStatus.ACTIVE]: "success",
  [BookingStatus.COMPLETED]: "success",
  [BookingStatus.CANCELLED]: "destructive",
  [BookingStatus.REJECTED]: "destructive",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  [PaymentStatus.PENDING]: "warning",
  [PaymentStatus.PAID]: "success",
  [PaymentStatus.PARTIALLY_PAID]: "info",
  [PaymentStatus.FAILED]: "destructive",
  [PaymentStatus.REFUNDED]: "muted",
};

export const DRIVER_STATUS_TONE: Record<DriverStatus, StatusTone> = {
  [DriverStatus.AVAILABLE]: "success",
  [DriverStatus.ON_TRIP]: "info",
  [DriverStatus.OFF_DUTY]: "muted",
  [DriverStatus.INACTIVE]: "destructive",
};

/** Turn an ENUM_CASE status into a human label, e.g. "OUT_FOR_PICKUP" -> "Out For Pickup". */
export function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
