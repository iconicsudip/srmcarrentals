import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { doorsCrud } from "@/modules/car-attributes/doors.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cars/doors/{id}:
 *   patch: { tags: [Car Attributes], summary: Update a door option, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Car Attributes], summary: Delete a door option, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  return ok(await doorsCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  await doorsCrud.remove(id);
  return noContent();
});
