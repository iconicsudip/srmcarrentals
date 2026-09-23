import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { colorsCrud } from "@/modules/car-attributes/colors.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cars/colors/{id}:
 *   patch: { tags: [Car Attributes], summary: Update a car color, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Car Attributes], summary: Delete a car color, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  return ok(await colorsCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  await colorsCrud.remove(id);
  return noContent();
});
