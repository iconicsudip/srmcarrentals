import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getBookingById } from "@/modules/bookings/bookings.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /bookings/{id}:
 *   get: { tags: [Bookings], summary: Get full booking detail (including its immutable pricing snapshot), responses: { 200: { description: Booking. } } }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("bookings.view");
  const { id } = await params;
  return ok(await getBookingById(id));
});
