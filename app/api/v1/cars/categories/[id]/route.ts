import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { categoriesCrud } from "@/modules/car-attributes/categories.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cars/categories/{id}:
 *   patch: { tags: [Car Attributes], summary: Update a car category, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Car Attributes], summary: Delete a car category, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  return ok(await categoriesCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  await categoriesCrud.remove(id);
  return noContent();
});
