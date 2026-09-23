/**
 * Shared enums mirrored 1:1 with `apps/api/prisma/schema.prisma`.
 * Kept as plain string unions (not imported from @prisma/client) so the
 * frontend apps never depend on the Prisma client package.
 */

export enum RoleName {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  BOOKING_MANAGER = "BOOKING_MANAGER",
  STAFF = "STAFF",
  DRIVER = "DRIVER",
  CUSTOMER = "CUSTOMER",
}

export enum Status {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum CarStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  MAINTENANCE = "MAINTENANCE",
}

/**
 * `PENDING` is the "Temporary Hold" state created the instant a customer
 * selects a car (see booking-availability rules) and auto-expires via a
 * BullMQ delayed job if the customer never reaches/completes payment.
 */
export enum BookingStatus {
  PENDING = "PENDING",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  CONFIRMED = "CONFIRMED",
  DRIVER_ASSIGNED = "DRIVER_ASSIGNED",
  OUT_FOR_PICKUP = "OUT_FOR_PICKUP",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
}

/** Booking statuses that block a car's availability for overlapping dates. */
export const BLOCKING_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING, // Temporary Hold
  BookingStatus.PAYMENT_PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.DRIVER_ASSIGNED,
  BookingStatus.OUT_FOR_PICKUP,
  BookingStatus.ACTIVE,
];

export enum GracePeriodMinutes {
  ZERO = 0,
  FIFTEEN = 15,
  THIRTY = 30,
  FORTY_FIVE = 45,
  SIXTY = 60,
}

export enum ExtraHourRoundingMode {
  EXACT_HOUR = "EXACT_HOUR",
  ROUND_UP = "ROUND_UP",
}

export enum PackageAssignmentScope {
  ALL_CARS = "ALL_CARS",
  SPECIFIC_CARS = "SPECIFIC_CARS",
  CAR_CATEGORY = "CAR_CATEGORY",
  CAR_TYPE = "CAR_TYPE",
}

export enum SeasonalAdjustmentType {
  FIXED_INCREASE = "FIXED_INCREASE",
  PERCENTAGE_INCREASE = "PERCENTAGE_INCREASE",
  FIXED_DISCOUNT = "FIXED_DISCOUNT",
  PERCENTAGE_DISCOUNT = "PERCENTAGE_DISCOUNT",
}

export enum InsurancePricingType {
  FIXED = "FIXED",
  PERCENTAGE = "PERCENTAGE",
  DAILY = "DAILY",
}

export enum ServicePricingType {
  PER_BOOKING = "PER_BOOKING",
  PER_DAY = "PER_DAY",
  PER_HOUR = "PER_HOUR",
}

export enum CouponDiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

export enum PaymentProvider {
  RAZORPAY = "RAZORPAY",
  STRIPE = "STRIPE",
  CASHFREE = "CASHFREE",
}

export enum PaymentType {
  FULL = "FULL",
  ADVANCE = "ADVANCE",
  PARTIAL = "PARTIAL",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum TransactionType {
  PAYMENT = "PAYMENT",
  REFUND = "REFUND",
  PAYOUT = "PAYOUT",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  ISSUED = "ISSUED",
  PAID = "PAID",
  VOID = "VOID",
}

export enum DriverStatus {
  AVAILABLE = "AVAILABLE",
  ON_TRIP = "ON_TRIP",
  OFF_DUTY = "OFF_DUTY",
  INACTIVE = "INACTIVE",
}

export enum CustomerAccountStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  BANNED = "BANNED",
}

export enum TaxType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

export enum BlogStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum PageStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

export enum RobotsMeta {
  INDEX_FOLLOW = "INDEX_FOLLOW",
  NOINDEX_FOLLOW = "NOINDEX_FOLLOW",
  INDEX_NOFOLLOW = "INDEX_NOFOLLOW",
  NOINDEX_NOFOLLOW = "NOINDEX_NOFOLLOW",
}

export enum SeoEntityType {
  HOMEPAGE = "HOMEPAGE",
  CAR = "CAR",
  CAR_CATEGORY = "CAR_CATEGORY",
  LOCATION = "LOCATION",
  AIRPORT = "AIRPORT",
  BLOG_POST = "BLOG_POST",
  PAGE = "PAGE",
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  STATUS_CHANGE = "STATUS_CHANGE",
}

/** Dot-notation permission keys, e.g. "cars.create". Kept as a const array
 * (not a TS enum) so it can be extended/seeded without a schema migration. */
export const PERMISSIONS = [
  "dashboard.view",

  "cars.view",
  "cars.create",
  "cars.edit",
  "cars.delete",
  "cars.attributes.manage", // brands/models/colors/features/etc

  "pricing.manage",
  "pricing.packages.manage",
  "pricing.seasonal.manage",

  "locations.manage",
  "airports.manage",

  "bookings.view",
  "bookings.create",
  "bookings.update",
  "bookings.cancel",
  "bookings.assign_driver",

  "customers.view",
  "customers.manage",

  "drivers.view",
  "drivers.manage",

  "payments.view",
  "payments.manage",
  "refunds.manage",
  "invoices.view",
  "taxes.manage",

  "coupons.manage",

  "insurances.manage",
  "extra_services.manage",

  "seo.manage",
  "cms.manage",
  "blog.manage",

  "chauffeur_services.manage",
  "tours.manage",
  "testimonials.manage",
  "gallery.manage",
  "homepage.manage",

  "users.manage",
  "roles.manage",
  "permissions.manage",
  "activity_logs.view",

  "settings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
