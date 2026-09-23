import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { assignDriverSchema } from "@/modules/bookings/bookings.schemas";
import { assignDriver } from "@/modules/bookings/bookings.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /bookings/{id}/assign-driver:
 *   post:
 *     tags: [Bookings]
 *     summary: Assign a driver to a confirmed booking
 *     responses: { 200: { description: Updated booking. } }
 */
export const POST = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("bookings.assign_driver");
  const { id } = await params;
  const { driverId } = assignDriverSchema.parse(await req.json());
  return ok(await assignDriver(id, driverId));
});
