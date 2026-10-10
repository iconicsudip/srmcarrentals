import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getBookingById } from "@/modules/bookings/bookings.service";
import { getSetting } from "@/modules/settings/settings.service";
import { bookingDetailsKey, type BookingCheckoutDetails } from "@/lib/booking-details/types";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /bookings/{id}:
 *   get: { tags: [Bookings], summary: Get full booking detail (including its immutable pricing snapshot), responses: { 200: { description: Booking. } } }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("bookings.view");
  const { id } = await params;
  const booking = await getBookingById(id);
  const checkoutDetails = await getSetting<BookingCheckoutDetails>(bookingDetailsKey(booking.bookingReference));
  return ok({ ...booking, checkoutDetails });
});
