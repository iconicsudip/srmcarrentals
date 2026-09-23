import { z } from "zod";

import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { completeTrip } from "@/modules/bookings/bookings.service";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({ actualKm: z.coerce.number().nonnegative().optional() });

/**
 * @swagger
 * /bookings/{id}/complete-trip:
 *   post:
 *     tags: [Bookings]
 *     summary: Mark the car as returned — moves the booking to Completed and credits the customer's total spent
 *     responses: { 200: { description: Updated booking. } }
 */
export const POST = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("bookings.update");
  const { id } = await params;
  const { actualKm } = schema.parse(await req.json().catch(() => ({})));
  return ok(await completeTrip(id, actualKm));
});
