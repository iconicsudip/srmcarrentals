import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { steeringTypesCrud } from "@/modules/car-attributes/steering-types.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cars/steering-types/{id}:
 *   patch: { tags: [Car Attributes], summary: Update a steering type, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Car Attributes], summary: Delete a steering type, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  return ok(await steeringTypesCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  await steeringTypesCrud.remove(id);
  return noContent();
});
