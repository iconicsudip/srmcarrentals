import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { confirmBooking } from "@/modules/bookings/bookings.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /bookings/{id}/confirm:
 *   post:
 *     tags: [Bookings]
 *     summary: Confirm a Pending/Payment Pending booking (cancels its hold-expiry job)
 *     responses: { 200: { description: Confirmed booking. } }
 */
export const POST = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("bookings.update");
  const { id } = await params;
  return ok(await confirmBooking(id));
});
