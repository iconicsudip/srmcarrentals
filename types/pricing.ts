/** Contract for POST /pricing/calculate — shared between apps/api and both frontends. */

export interface PricingCalculateRequest {
  carId: string;
  pickupDateTime: string; // ISO-8601
  dropDateTime: string; // ISO-8601
  pickupLocationId?: string;
  dropLocationId?: string;
  pickupIsAirport?: boolean;
  dropIsAirport?: boolean;
  pickupAirportId?: string;
  dropAirportId?: string;
  estimatedKm?: number;
  rentalPackageId?: string;
  extraServiceIds?: string[];
  insuranceId?: string;
  couponCode?: string;
}

export interface PricingDuration {
  totalHours: number;
  fullDays: number;
  extraHours: number;
  gracePeriodMinutes: number;
  gracePeriodApplied: boolean;
}

export interface PricingRentalBreakdown {
  dailyPrice: number;
  hourlyPrice: number;
  basePrice: number;
  extraHourCharge: number;
  /** Per-unit rates actually applied — resolved from either the car's base
   * CarPricing config or an overriding Rental Package, so callers (like the
   * booking snapshot) never have to re-derive them from totals. */
  includedKmPerUnit: number;
  extraKmPrice: number;
  extraHourPrice: number;
  includedKm: number;
  extraKm: number;
  extraKmCharge: number;
}

export interface PricingAirportBreakdown {
  pickupCharge: number;
  dropCharge: number;
}

export interface PricingSeasonalBreakdown {
  seasonName: string | null;
  adjustment: number;
}

export interface PricingServiceLineItem {
  id: string;
  name: string;
  price: number;
}

export interface PricingInsuranceBreakdown {
  id: string;
  name: string;
  price: number;
}

export interface PricingCouponBreakdown {
  code: string | null;
  discount: number;
  valid: boolean;
  reason?: string;
}

export interface PricingTaxBreakdown {
  name: string;
  percentage: number;
  amount: number;
}

export interface PricingCalculateResponse {
  duration: PricingDuration;
  rental: PricingRentalBreakdown;
  airport: PricingAirportBreakdown;
  seasonal: PricingSeasonalBreakdown;
  services: PricingServiceLineItem[];
  insurance: PricingInsuranceBreakdown | null;
  discount: number;
  coupon: PricingCouponBreakdown;
  subtotal: number;
  tax: PricingTaxBreakdown[];
  totalTax: number;
  total: number;
}

/** Immutable snapshot persisted on the Booking at creation time. */
export interface BookingPricingSnapshot {
  dailyPrice: number;
  hourlyPrice: number;
  includedKmPerDay: number;
  extraKmPrice: number;
  extraHourPrice: number;
  gracePeriodMinutes: number;
  totalHours: number;
  fullDays: number;
  extraHours: number;
  rentalPrice: number;
  extraHourCharge: number;
  estimatedKm: number;
  extraKmCharge: number;
  airportPickupCharge: number;
  airportDropCharge: number;
  seasonalAdjustment: number;
  servicesTotal: number;
  insuranceCharge: number;
  discount: number;
  couponCode: string | null;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotal: number;
}
