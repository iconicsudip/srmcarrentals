import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { cancelBookingSchema } from "@/modules/bookings/bookings.schemas";
import { cancelBooking } from "@/modules/bookings/bookings.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   post:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     responses: { 200: { description: Cancelled booking. } }
 */
export const POST = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("bookings.cancel");
  const { id } = await params;
  const { reason } = cancelBookingSchema.parse(await req.json().catch(() => ({})));
  return ok(await cancelBooking(id, reason));
});
