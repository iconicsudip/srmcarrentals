import type { Prisma } from "@prisma/client";
import { BookingStatus } from "@srm/types";
import { roundCurrency } from "@srm/utils";

import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/http/errors";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { cancelBookingHoldJob, scheduleBookingHoldExpiry } from "@/lib/queues/booking-hold.queue";
import { calculatePricing } from "@/modules/pricing/pricing.service";
import { generateBookingReference } from "@/modules/bookings/booking-reference";
import { isCarAvailable, lockCarForBooking } from "@/modules/bookings/availability.service";
import type { CreateBookingInput } from "@/modules/bookings/bookings.schemas";
import { splitAdvance } from "@/lib/checkout/advance";
import { cancelSmartPaymentLink, createSmartPaymentLink, listSmartLinks } from "@/lib/razorpay/razorpay-service";

const BOOKING_DETAIL_INCLUDE = {
  car: {
    include: {
      brand: true,
      model: true,
      images: { take: 1, orderBy: { sortOrder: "asc" as const } },
    },
  },
  customer: true,
  driver: true,
  pickupLocation: true,
  dropLocation: true,
  pickupAirport: true,
  dropAirport: true,
  rentalPackage: true,
  insurance: true,
  coupon: true,
  pricingSnapshot: true,
  extraServices: { include: { extraService: true } },
  payments: true,
  invoice: true,
} satisfies Prisma.BookingInclude;

async function upsertGuestCustomer(
  tx: Prisma.TransactionClient,
  details: { firstName: string; lastName: string; email: string; phone: string; userId?: string },
) {
  const existingUser = details.userId
    ? await tx.user.findUnique({ where: { id: details.userId } })
    : await tx.user.findUnique({ where: { email: details.email.toLowerCase() } });

  return tx.customer.upsert({
    where: { email: details.email.toLowerCase() },
    update: {
      firstName: details.firstName,
      lastName: details.lastName,
      phone: details.phone,
      ...(existingUser ? { userId: existingUser.id } : {}),
    },
    create: {
      firstName: details.firstName,
      lastName: details.lastName,
      email: details.email.toLowerCase(),
      phone: details.phone,
      ...(existingUser ? { userId: existingUser.id } : {}),
    },
  });
}

export async function createBooking(input: CreateBookingInput, origin?: string) {
  // Authoritative pricing is computed once, read-only, before we open the
  // write transaction — it's the same engine POST /pricing/calculate uses,
  // so a booking can never be created at a price the customer didn't see.
  const pricing = await calculatePricing({
    carId: input.carId,
    pickupDateTime: input.pickupDateTime,
    dropDateTime: input.dropDateTime,
    pickupLocationId: input.pickupLocationId,
    dropLocationId: input.dropLocationId,
    pickupIsAirport: input.pickupIsAirport,
    dropIsAirport: input.dropIsAirport,
    pickupAirportId: input.pickupAirportId,
    dropAirportId: input.dropAirportId,
    estimatedKm: input.estimatedKm,
    rentalPackageId: input.rentalPackageId,
    extraServiceIds: input.extraServiceIds,
    insuranceId: input.insuranceId,
    couponCode: input.couponCode,
  });

  const holdMinutes = getEnv().BOOKING_HOLD_MINUTES;
  const holdExpiresAt = new Date(Date.now() + holdMinutes * 60_000);
  const bookingReference = generateBookingReference();

  const bookingId = await prisma.$transaction(async (tx) => {
    // Row-lock the car so a second, concurrent createBooking() for the same
    // car blocks here until this transaction commits or rolls back — the
    // actual double-booking fix, not just an optimistic check.
    await lockCarForBooking(tx, input.carId);

    const available = await isCarAvailable(tx, input.carId, input.pickupDateTime, input.dropDateTime);
    if (!available) {
      throw new ConflictError("This car is no longer available for the selected dates");
    }

    let customerId = input.customerId;
    if (customerId) {
      const custExists = await tx.customer.findUnique({ where: { id: customerId } });
      if (!custExists) {
        const custByUser = await tx.customer.findUnique({ where: { userId: customerId } });
        if (custByUser) {
          customerId = custByUser.id;
        } else if (input.customer) {
          const cust = await upsertGuestCustomer(tx, { ...input.customer, userId: customerId });
          customerId = cust.id;
        }
      }
    }
    if (!customerId) {
      const cust = await upsertGuestCustomer(tx, input.customer!);
      customerId = cust.id;
    }

    let couponId: string | undefined;
    if (pricing.coupon.valid && pricing.coupon.code) {
      const coupon = await tx.coupon.findUnique({ where: { code: pricing.coupon.code } });
      // Re-check the usage limit inside the transaction to close (most of)
      // the race window between the read-only price preview and this write.
      if (coupon && (coupon.usageLimit == null || coupon.usedCount < coupon.usageLimit)) {
        couponId = coupon.id;
      }
    }

    const booking = await tx.booking.create({
      data: {
        bookingReference,
        carId: input.carId,
        customerId,
        pickupLocationId: input.pickupLocationId,
        dropLocationId: input.dropLocationId,
        pickupAirportId: input.pickupAirportId,
        dropAirportId: input.dropAirportId,
        pickupIsAirport: input.pickupIsAirport,
        dropIsAirport: input.dropIsAirport,
        pickupDateTime: input.pickupDateTime,
        dropDateTime: input.dropDateTime,
        status: BookingStatus.PENDING,
        holdExpiresAt,
        rentalPackageId: input.rentalPackageId,
        insuranceId: input.insuranceId,
        couponId,
        couponCode: couponId ? pricing.coupon.code : undefined,
        estimatedKm: input.estimatedKm,
      },
    });

    await tx.bookingPricingSnapshot.create({
      data: {
        bookingId: booking.id,
        dailyPrice: pricing.rental.dailyPrice,
        hourlyPrice: pricing.rental.hourlyPrice || undefined,
        includedKmPerDay: pricing.rental.includedKmPerUnit,
        extraKmPrice: pricing.rental.extraKmPrice,
        extraHourPrice: pricing.rental.extraHourPrice,
        gracePeriodMinutes: pricing.duration.gracePeriodMinutes,
        totalHours: pricing.duration.totalHours,
        fullDays: pricing.duration.fullDays,
        extraHours: pricing.duration.extraHours,
        rentalPrice: pricing.rental.basePrice,
        extraHourCharge: pricing.rental.extraHourCharge,
        estimatedKm: input.estimatedKm,
        extraKmCharge: pricing.rental.extraKmCharge,
        airportPickupCharge: pricing.airport.pickupCharge,
        airportDropCharge: pricing.airport.dropCharge,
        locationDropCharge: pricing.locationDropCharge ?? 0,
        seasonalAdjustment: pricing.seasonal.adjustment,
        servicesTotal: pricing.services.reduce((sum, s) => sum + s.price, 0),
        insuranceCharge: pricing.insurance?.price ?? 0,
        discount: pricing.discount,
        couponCode: couponId ? pricing.coupon.code : undefined,
        subtotal: pricing.subtotal,
        taxPercentage: pricing.tax[0]?.percentage ?? 0,
        taxAmount: pricing.totalTax,
        grandTotal: pricing.total,
      },
    });

    if (pricing.services.length > 0) {
      await tx.bookingExtraService.createMany({
        data: pricing.services.map((s) => ({
          bookingId: booking.id,
          extraServiceId: s.id,
          quantity: 1,
          priceAtBooking: s.price,
        })),
      });
    }

    if (couponId) {
      await tx.couponUsage.create({
        data: { couponId, bookingId: booking.id, customerId, discountAmount: pricing.discount },
      });
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    }

    await tx.customer.update({ where: { id: customerId }, data: { totalBookings: { increment: 1 } } });

    return booking.id;
  });

  // Only after the transaction commits do we schedule the expiry job — if
  // the transaction rolled back (e.g. lost the availability race), nothing
  // is scheduled for a booking that doesn't exist.
  await scheduleBookingHoldExpiry(bookingId, holdMinutes * 60_000);

  const bookingRecord = await getBookingById(bookingId);

  let paymentUrl: string | undefined;
  let paymentLinkId: string | undefined;

  if (input.paymentMethod === "ONLINE") {
    try {
      const custName = input.customer
        ? `${input.customer.firstName} ${input.customer.lastName}`.trim()
        : `${bookingRecord.customer?.firstName || ""} ${bookingRecord.customer?.lastName || ""}`.trim() || "Customer";
      const custPhone = input.customer?.phone || bookingRecord.customer?.phone;
      const custEmail = input.customer?.email || bookingRecord.customer?.email;

      const link = await createSmartPaymentLink({
        amount: splitAdvance(Number(pricing.total)).now,
        purpose: `SRM Self-Drive Booking #${bookingReference} — 30% advance`,
        customerName: custName,
        customerPhone: custPhone,
        customerEmail: custEmail && !custEmail.includes("@guest.") ? custEmail : undefined,
        bookingReference,
        bookingId,
        notifySms: true,
        notifyEmail: Boolean(custEmail && !custEmail.includes("@guest.")),
        callbackUrl: `${(origin || process.env.NEXT_PUBLIC_APP_URL || "https://srmcarrentals.com").replace(/\/$/, "")}/booking/${bookingReference}?payment_status=completed`,
        origin,
      });

      paymentUrl = link.shortUrl;
      paymentLinkId = link.id;

      // Update status to PAYMENT_PENDING for clarity
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.PAYMENT_PENDING },
      });
      bookingRecord.status = BookingStatus.PAYMENT_PENDING;
    } catch (err) {
      console.error("Failed to generate payment link for online booking:", err);
    }
  }

  return {
    ...bookingRecord,
    paymentUrl,
    paymentLinkId,
  };
}

/** Called by the BullMQ worker when a hold's delay elapses. Only releases
 * the car if the booking is still PENDING (untouched) — if staff confirmed
 * or cancelled it in the meantime, this is a safe no-op. */
export async function expireBookingHold(bookingId: string): Promise<void> {
  await prisma.booking.updateMany({
    where: { id: bookingId, status: BookingStatus.PENDING },
    data: { status: BookingStatus.CANCELLED, cancelledAt: new Date(), cancellationReason: "Temporary hold expired" },
  });
}

export interface BookingListFilters {
  status?: string;
  search?: string;
  carId?: string;
  customerId?: string;
}

export async function listBookings(req: Request, filters: BookingListFilters) {
  const url = new URL(req.url);
  const { page, limit, skip, take } = parsePagination(url);

  const where: Prisma.BookingWhereInput = {
    ...(filters.status ? { status: filters.status as Prisma.EnumBookingStatusFilter["equals"] } : {}),
    ...(filters.carId ? { carId: filters.carId } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.search
      ? {
          OR: [
            { bookingReference: { contains: filters.search, mode: "insensitive" } },
            { customer: { firstName: { contains: filters.search, mode: "insensitive" } } },
            { customer: { lastName: { contains: filters.search, mode: "insensitive" } } },
            { customer: { email: { contains: filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: {
        car: { include: { brand: true, model: true } },
        customer: true,
        driver: true,
        pricingSnapshot: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.booking.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: BOOKING_DETAIL_INCLUDE });
  if (!booking) throw new NotFoundError("Booking not found");
  return booking;
}

export async function getBookingByReference(bookingReference: string) {
  const booking = await prisma.booking.findUnique({
    where: { bookingReference },
    include: BOOKING_DETAIL_INCLUDE,
  });
  if (!booking) throw new NotFoundError("Booking not found");
  return booking;
}

export async function getPublicBookingByReference(bookingReference: string) {
  const booking = await getBookingByReference(bookingReference);
  return JSON.parse(JSON.stringify(booking));
}

export async function confirmBooking(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new NotFoundError("Booking not found");
  if (![BookingStatus.PENDING, BookingStatus.PAYMENT_PENDING].includes(booking.status as BookingStatus)) {
    throw new BadRequestError(`Cannot confirm a booking in status ${booking.status}`);
  }

  await cancelBookingHoldJob(id);
  return prisma.booking.update({ where: { id }, data: { status: BookingStatus.CONFIRMED }, include: BOOKING_DETAIL_INCLUDE });
}

export async function cancelBooking(id: string, reason?: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new NotFoundError("Booking not found");
  if ([BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REJECTED].includes(booking.status as BookingStatus)) {
    throw new BadRequestError(`Cannot cancel a booking in status ${booking.status}`);
  }

  await cancelBookingHoldJob(id);
  return prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.CANCELLED, cancelledAt: new Date(), cancellationReason: reason },
    include: BOOKING_DETAIL_INCLUDE,
  });
}

export async function assignDriver(id: string, driverId: string) {
  const [booking, driver] = await Promise.all([
    prisma.booking.findUnique({ where: { id } }),
    prisma.driver.findUnique({ where: { id: driverId } }),
  ]);
  if (!booking) throw new NotFoundError("Booking not found");
  if (!driver) throw new NotFoundError("Driver not found");
  if (![BookingStatus.CONFIRMED, BookingStatus.DRIVER_ASSIGNED].includes(booking.status as BookingStatus)) {
    throw new BadRequestError("Confirm the booking before assigning a driver");
  }

  return prisma.booking.update({
    where: { id },
    data: { driverId, status: BookingStatus.DRIVER_ASSIGNED },
    include: BOOKING_DETAIL_INCLUDE,
  });
}

export async function startTrip(id: string) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new NotFoundError("Booking not found");
  if (![BookingStatus.CONFIRMED, BookingStatus.DRIVER_ASSIGNED, BookingStatus.OUT_FOR_PICKUP].includes(booking.status as BookingStatus)) {
    throw new BadRequestError(`Cannot start a trip from status ${booking.status}`);
  }

  return prisma.booking.update({
    where: { id },
    data: { status: BookingStatus.ACTIVE, actualPickupAt: new Date() },
    include: BOOKING_DETAIL_INCLUDE,
  });
}

export async function completeTrip(id: string, actualKm?: number) {
  const booking = await prisma.booking.findUnique({ where: { id }, include: { pricingSnapshot: true } });
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.status !== BookingStatus.ACTIVE) {
    throw new BadRequestError("Only an active trip can be completed");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED, actualDropAt: new Date(), actualKm },
    });

    if (booking.pricingSnapshot) {
      await tx.customer.update({
        where: { id: booking.customerId },
        data: { totalSpent: { increment: roundCurrency(Number(booking.pricingSnapshot.grandTotal)) } },
      });
    }

    // Fetch last, inside the same transaction, so the returned `customer`
    // relation reflects the totalSpent increment above rather than a stale
    // pre-increment snapshot.
    return tx.booking.findUniqueOrThrow({ where: { id }, include: BOOKING_DETAIL_INCLUDE });
  });

  return updated;
}

export async function getOrCreateBookingPaymentLink(bookingReference: string, origin?: string) {
  const booking = await getBookingByReference(bookingReference);
  const links = await listSmartLinks();
  const amount = splitAdvance(Number(booking.pricingSnapshot?.grandTotal || 0)).now;
  const bookingLinks = links.filter(
    (l) => l.bookingReference === bookingReference || l.bookingId === booking.id,
  );

  // Reuse a link only while it still matches the current order value.
  const existingActive = bookingLinks.find(
    (l) => l.status === "PAID" || (l.status === "ISSUED" && Math.abs(l.amount - amount) < 0.01),
  );

  if (existingActive) {
    return {
      paymentUrl: existingActive.shortUrl,
      paymentLinkId: existingActive.id,
      razorpayLinkId: existingActive.razorpayLinkId,
      status: existingActive.status,
    };
  }

  // Order value changed since the link was issued: retire the stale link(s).
  for (const stale of bookingLinks.filter((l) => l.status === "ISSUED")) {
    await cancelSmartPaymentLink(stale.id);
  }

  const custName = `${booking.customer?.firstName || ""} ${booking.customer?.lastName || ""}`.trim() || "Customer";
  const custPhone = booking.customer?.phone;
  const custEmail = booking.customer?.email;

  const link = await createSmartPaymentLink({
    amount: amount > 0 ? amount : 1,
    purpose: `SRM Self-Drive Booking #${bookingReference}`,
    customerName: custName,
    customerPhone: custPhone,
    customerEmail: custEmail && !custEmail.includes("@guest.") ? custEmail : undefined,
    bookingReference: booking.bookingReference,
    bookingId: booking.id,
    notifySms: true,
    notifyEmail: Boolean(custEmail && !custEmail.includes("@guest.")),
    callbackUrl: `${(origin || process.env.NEXT_PUBLIC_APP_URL || "https://srmcarrentals.com").replace(/\/$/, "")}/booking/${bookingReference}?payment_status=completed`,
    origin,
  });

  return {
    paymentUrl: link.shortUrl,
    paymentLinkId: link.id,
    razorpayLinkId: link.razorpayLinkId,
    status: link.status,
  };
}

export async function confirmBookingWithPayment(params: {
  bookingReference: string;
  paymentId?: string;
  provider?: "RAZORPAY" | "STRIPE" | "CASHFREE";
  amount?: number;
}) {
  const booking = await prisma.booking.findUnique({
    where: { bookingReference: params.bookingReference },
    include: BOOKING_DETAIL_INCLUDE,
  });
  if (!booking) throw new NotFoundError("Booking not found");

  await cancelBookingHoldJob(booking.id);

  const grandTotal = Number(booking.pricingSnapshot?.grandTotal ?? 0);
  const finalAmount = params.amount ?? grandTotal;

  if (booking.status === BookingStatus.CONFIRMED && booking.payments.some((p) => p.status === "PAID")) {
    return booking;
  }

  if (params.paymentId || finalAmount > 0) {
    const existingPayment = booking.payments.find(
      (p) => p.providerPaymentId === params.paymentId || p.status === "PAID",
    );

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          provider: params.provider || "RAZORPAY",
          paymentType: grandTotal > 0 && finalAmount < grandTotal ? "ADVANCE" : "FULL",
          amount: finalAmount,
          status: "PAID",
          providerPaymentId: params.paymentId || `pay_rzp_${Date.now()}`,
          paidAt: new Date(),
        },
      });
    }
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: BookingStatus.CONFIRMED },
    include: BOOKING_DETAIL_INCLUDE,
  });

  return updated;
}

