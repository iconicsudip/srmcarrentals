import type {
  PricingAirportBreakdown,
  PricingCalculateResponse,
  PricingCouponBreakdown,
  PricingInsuranceBreakdown,
  PricingSeasonalBreakdown,
  PricingServiceLineItem,
} from "@srm/types";
import { CouponDiscountType, ExtraHourRoundingMode, PackageAssignmentScope, SeasonalAdjustmentType, TaxType } from "@srm/types";
import { roundCurrency } from "@srm/utils";

import { prisma } from "@/lib/prisma";
import { getMapProvider } from "@/lib/map";
import { BadRequestError, NotFoundError } from "@/lib/http/errors";
import type { PricingCalculateDto } from "@/modules/pricing/dto/pricing-calculate.dto";
import { calculateAirportLegCharge } from "@/modules/pricing/services/airport-pricing.service";
import { validateAndCalculateCoupon, findCouponByCode } from "@/modules/pricing/services/coupon-pricing.service";
import { calculateHourlyPrice, shouldUseHourlyPricing } from "@/modules/pricing/services/hourly-pricing.service";
import { calculateKmPricing } from "@/modules/pricing/services/km-pricing.service";
import { resolveLocations } from "@/modules/pricing/services/location-pricing.service";
import { calculateRentalPrice } from "@/modules/pricing/services/rental-pricing.service";
import {
  calculateSeasonalAdjustment,
  findApplicableSeasonalPricing,
} from "@/modules/pricing/services/seasonal-pricing.service";
import { calculateTax, findDefaultTax } from "@/modules/pricing/services/tax-pricing.service";

async function resolveRentalPackage(packageId: string, car: { id: string; categoryId: string; carTypeId: string }) {
  const pkg = await prisma.rentalPackage.findUnique({ where: { id: packageId }, include: { cars: true } });
  if (!pkg || pkg.status !== "ACTIVE") throw new NotFoundError("Rental package not found or inactive");

  const applies =
    pkg.scope === PackageAssignmentScope.ALL_CARS ||
    (pkg.scope === PackageAssignmentScope.SPECIFIC_CARS && pkg.cars.some((c) => c.carId === car.id)) ||
    (pkg.scope === PackageAssignmentScope.CAR_CATEGORY && pkg.carCategoryId === car.categoryId) ||
    (pkg.scope === PackageAssignmentScope.CAR_TYPE && pkg.carTypeId === car.carTypeId);

  if (!applies) throw new BadRequestError("This rental package is not available for the selected car");
  return pkg;
}

async function resolveOneAirportLegCharge(
  airportId: string,
  locationId: string | undefined,
  leg: "pickup" | "drop",
): Promise<number> {
  if (locationId) {
    const explicit = await prisma.airportLocationCharge.findUnique({
      where: { airportId_locationId: { airportId, locationId } },
    });
    if (explicit) {
      return calculateAirportLegCharge({
        isAirport: true,
        explicitCharge: Number(leg === "pickup" ? explicit.pickupCharge : explicit.dropCharge),
      });
    }

    const [airport, location, distancePricing] = await Promise.all([
      prisma.airport.findUnique({ where: { id: airportId } }),
      prisma.location.findUnique({ where: { id: locationId } }),
      prisma.airportDistancePricing.findUnique({ where: { airportId } }),
    ]);

    if (airport && location && distancePricing?.status === "ACTIVE") {
      const distanceKm = await getMapProvider().getDistanceKm(
        { latitude: Number(airport.latitude), longitude: Number(airport.longitude) },
        { latitude: Number(location.latitude), longitude: Number(location.longitude) },
      );
      return calculateAirportLegCharge({
        isAirport: true,
        distanceFallback: {
          distanceKm,
          baseCharge: Number(distancePricing.baseCharge),
          includedKm: Number(distancePricing.includedKm),
          extraKmPrice: Number(distancePricing.extraKmPrice),
        },
      });
    }
  }

  // No explicit charge and no distance-pricing configured — admin hasn't set this leg up yet.
  return calculateAirportLegCharge({ isAirport: true });
}

async function resolveAirportBreakdown(input: PricingCalculateDto): Promise<PricingAirportBreakdown> {
  // The two legs are resolved independently — a booking can be airport-only
  // on pickup, drop, or (round trip / fly-in-fly-out) both at once, per the
  // spec's price breakdown example which shows a nonzero charge on each side
  // simultaneously (Airport Pickup ₹700 + Airport Drop ₹500).
  let pickupCharge = 0;
  let dropCharge = 0;

  if (input.pickupIsAirport && input.pickupAirportId) {
    pickupCharge = await resolveOneAirportLegCharge(input.pickupAirportId, input.dropLocationId, "pickup");
  }
  if (input.dropIsAirport && input.dropAirportId) {
    dropCharge = await resolveOneAirportLegCharge(input.dropAirportId, input.pickupLocationId, "drop");
  }

  return { pickupCharge, dropCharge };
}

async function resolveExtraServices(
  extraServiceIds: string[],
  fullDays: number,
  totalHours: number,
): Promise<{ total: number; items: PricingServiceLineItem[] }> {
  if (extraServiceIds.length === 0) return { total: 0, items: [] };

  const services = await prisma.extraService.findMany({ where: { id: { in: extraServiceIds }, status: "ACTIVE" } });

  const items: PricingServiceLineItem[] = services.map((service) => {
    const unitPrice = Number(service.price);
    let amount = unitPrice;
    if (service.pricingType === "PER_DAY") amount = unitPrice * fullDays;
    else if (service.pricingType === "PER_HOUR") amount = unitPrice * Math.ceil(totalHours);

    return { id: service.id, name: service.name, price: roundCurrency(amount) };
  });

  return { total: roundCurrency(items.reduce((sum, item) => sum + item.price, 0)), items };
}

async function resolveInsurance(
  insuranceId: string | undefined,
  rentalSubtotal: number,
  fullDays: number,
): Promise<PricingInsuranceBreakdown | null> {
  if (!insuranceId) return null;

  const insurance = await prisma.insurance.findFirst({ where: { id: insuranceId, status: "ACTIVE" } });
  if (!insurance) throw new NotFoundError("Insurance option not found or inactive");

  let price = 0;
  if (insurance.pricingType === "FIXED") price = Number(insurance.fixedPrice ?? 0);
  else if (insurance.pricingType === "PERCENTAGE") price = (rentalSubtotal * Number(insurance.percentagePrice ?? 0)) / 100;
  else if (insurance.pricingType === "DAILY") price = Number(insurance.dailyPrice ?? 0) * fullDays;

  return { id: insurance.id, name: insurance.name, price: roundCurrency(price) };
}

/**
 * The single authoritative pricing calculation for the entire platform.
 * Every number the customer sees — on the search results page, the booking
 * page, or the final checkout — comes from this function running on the
 * server. The frontend never computes or submits a price.
 */
export async function calculatePricing(input: PricingCalculateDto): Promise<PricingCalculateResponse> {
  const car = await prisma.car.findUnique({
    where: { id: input.carId },
    include: { pricing: true },
  });
  if (!car) throw new NotFoundError("Car not found");
  if (!car.pricing) throw new BadRequestError("This car does not have pricing configured yet");

  await resolveLocations(input.pickupLocationId, input.dropLocationId);

  // ---- 1. Resolve which rate card applies: Rental Package > Hourly > Daily ----
  let unitPrice = Number(car.pricing.dailyPrice);
  let extraHourPrice = Number(car.pricing.extraHourPrice);
  let includedKmPerUnit = car.pricing.includedKmPerDay;
  let extraKmPrice = Number(car.pricing.extraKmPrice);
  let blockHours = 24;

  if (input.rentalPackageId) {
    const pkg = await resolveRentalPackage(input.rentalPackageId, car);
    unitPrice = Number(pkg.basePrice);
    extraHourPrice = Number(pkg.extraHourPrice);
    includedKmPerUnit = pkg.includedKm;
    extraKmPrice = Number(pkg.extraKmPrice);
    blockHours = pkg.durationHours;
  }

  const gracePeriodMinutes = car.pricing.gracePeriodMinutes;
  const roundingMode = car.pricing.extraHourRoundingMode as ExtraHourRoundingMode;

  // ---- 2. Rental price: pure-hourly mode for short rentals, else the 24h/package-block formula ----
  const rawHours = (input.dropDateTime.getTime() - input.pickupDateTime.getTime()) / 3_600_000;
  const useHourly =
    !input.rentalPackageId && shouldUseHourlyPricing(rawHours, car.pricing.hourlyPrice ? Number(car.pricing.hourlyPrice) : null);

  let totalHours: number;
  let fullDays: number;
  let extraHours: number;
  let gracePeriodApplied: boolean;
  let basePrice: number;
  let extraHourCharge: number;

  if (useHourly) {
    const hourly = calculateHourlyPrice({
      totalHours: rawHours,
      hourlyPrice: Number(car.pricing.hourlyPrice),
      minHourlyBookingHours: car.pricing.minHourlyBookingHours ?? undefined,
    });
    totalHours = hourly.billableHours;
    fullDays = 1; // treat as one included-KM block
    extraHours = 0;
    gracePeriodApplied = false;
    basePrice = hourly.total;
    extraHourCharge = 0;
  } else {
    const rental = calculateRentalPrice({
      pickupDateTime: input.pickupDateTime,
      dropDateTime: input.dropDateTime,
      unitPrice,
      extraHourPrice,
      gracePeriodMinutes,
      roundingMode,
      blockHours,
    });
    totalHours = rental.totalHours;
    fullDays = rental.fullDays;
    extraHours = rental.extraHours;
    gracePeriodApplied = rental.gracePeriodApplied;
    basePrice = rental.basePrice;
    extraHourCharge = rental.extraHourCharge;
  }

  // ---- 3. KM pricing ----
  const km = calculateKmPricing({
    fullDays,
    includedKmPerDay: includedKmPerUnit,
    extraKmPrice,
    estimatedKm: input.estimatedKm,
  });

  // ---- 4. Seasonal pricing (adjusts the rental base price) ----
  const seasonalRule = await findApplicableSeasonalPricing({
    carId: car.id,
    categoryId: car.categoryId,
    carTypeId: car.carTypeId,
    date: input.pickupDateTime,
  });
  const seasonalAdjustment = calculateSeasonalAdjustment(
    basePrice,
    seasonalRule
      ? { type: seasonalRule.adjustmentType as SeasonalAdjustmentType, value: Number(seasonalRule.adjustmentValue) }
      : null,
  );
  const seasonal: PricingSeasonalBreakdown = { seasonName: seasonalRule?.name ?? null, adjustment: seasonalAdjustment };

  // ---- 5. Airport charges ----
  const airport = await resolveAirportBreakdown(input);

  // ---- 6. Extra services + insurance ----
  const { total: servicesTotal, items: services } = await resolveExtraServices(input.extraServiceIds, fullDays, totalHours);
  const rentalSubtotalForInsurance = basePrice + extraHourCharge + seasonalAdjustment;
  const insurance = await resolveInsurance(input.insuranceId, rentalSubtotalForInsurance, fullDays);

  // ---- 7. Subtotal before discount/tax ----
  const preDiscountSubtotal = roundCurrency(
    basePrice +
      extraHourCharge +
      seasonalAdjustment +
      km.extraKmCharge +
      airport.pickupCharge +
      airport.dropCharge +
      servicesTotal +
      (insurance?.price ?? 0),
  );

  // ---- 8. Coupon ----
  let couponResult: PricingCouponBreakdown = { code: null, discount: 0, valid: false };
  if (input.couponCode) {
    const couponRow = await findCouponByCode(input.couponCode);
    const validated = validateAndCalculateCoupon(
      couponRow
        ? {
            discountType: couponRow.discountType as CouponDiscountType,
            percentage: couponRow.percentage ? Number(couponRow.percentage) : null,
            fixedAmount: couponRow.fixedAmount ? Number(couponRow.fixedAmount) : null,
            maxDiscount: couponRow.maxDiscount ? Number(couponRow.maxDiscount) : null,
            minBookingAmount: couponRow.minBookingAmount ? Number(couponRow.minBookingAmount) : null,
            startDate: couponRow.startDate,
            endDate: couponRow.endDate,
            usageLimit: couponRow.usageLimit,
            usedCount: couponRow.usedCount,
            status: couponRow.status,
          }
        : null,
      preDiscountSubtotal,
    );
    couponResult = { code: input.couponCode, discount: validated.discount, valid: validated.valid, reason: validated.reason };
  }

  const subtotal = roundCurrency(preDiscountSubtotal - couponResult.discount);

  // ---- 9. Tax ----
  const defaultTax = await findDefaultTax();
  const tax = calculateTax(
    subtotal,
    defaultTax
      ? { name: defaultTax.name, type: defaultTax.type as TaxType, percentage: Number(defaultTax.percentage) }
      : null,
  );

  const total = roundCurrency(subtotal + tax.amount);

  return {
    duration: { totalHours, fullDays, extraHours, gracePeriodMinutes, gracePeriodApplied },
    rental: {
      dailyPrice: unitPrice,
      hourlyPrice: car.pricing.hourlyPrice ? Number(car.pricing.hourlyPrice) : 0,
      basePrice,
      extraHourCharge,
      includedKmPerUnit,
      extraKmPrice,
      extraHourPrice,
      includedKm: km.includedKm,
      extraKm: km.extraKm,
      extraKmCharge: km.extraKmCharge,
    },
    airport,
    seasonal,
    services,
    insurance,
    discount: couponResult.discount,
    coupon: couponResult,
    subtotal,
    tax: tax.amount > 0 ? [{ name: tax.name, percentage: tax.percentage, amount: tax.amount }] : [],
    totalTax: tax.amount,
    total,
  };
}
