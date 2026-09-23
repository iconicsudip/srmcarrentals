import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { updateAirportChargeSchema } from "@/modules/airports/airport-charges.schemas";
import { deleteAirportCharge, updateAirportCharge } from "@/modules/airports/airport-charges.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /airports/charges/{id}:
 *   patch: { tags: [Airports], summary: Update an airport charge, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Airports], summary: Delete an airport charge, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("airports.manage");
  const { id } = await params;
  const body = updateAirportChargeSchema.parse(await req.json());
  return ok(await updateAirportCharge(id, body));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("airports.manage");
  const { id } = await params;
  await deleteAirportCharge(id);
  return noContent();
});
