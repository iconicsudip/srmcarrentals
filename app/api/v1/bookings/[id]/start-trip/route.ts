import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { startTrip } from "@/modules/bookings/bookings.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /bookings/{id}/start-trip:
 *   post:
 *     tags: [Bookings]
 *     summary: Mark the car as picked up — moves the booking to Active
 *     responses: { 200: { description: Updated booking. } }
 */
export const POST = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("bookings.update");
  const { id } = await params;
  return ok(await startTrip(id));
});
