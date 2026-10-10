import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getOrCreateBookingPaymentLink } from "@/modules/bookings/bookings.service";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/http/errors";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandling<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const origin = new URL(req.url).origin;

  // Find booking by ID or reference
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id }, { bookingReference: id }],
    },
  });

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  const result = await getOrCreateBookingPaymentLink(booking.bookingReference, origin);
  return ok(result);
});

export const POST = withErrorHandling<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const origin = new URL(req.url).origin;

  const booking = await prisma.booking.findFirst({
    where: {
      OR: [{ id }, { bookingReference: id }],
    },
  });

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  const result = await getOrCreateBookingPaymentLink(booking.bookingReference, origin);
  return ok(result);
});
