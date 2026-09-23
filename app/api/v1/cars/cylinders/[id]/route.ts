import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { cylindersCrud } from "@/modules/car-attributes/cylinders.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cars/cylinders/{id}:
 *   patch: { tags: [Car Attributes], summary: Update a cylinder option, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Car Attributes], summary: Delete a cylinder option, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  return ok(await cylindersCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  await cylindersCrud.remove(id);
  return noContent();
});
