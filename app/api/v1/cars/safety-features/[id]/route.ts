import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { safetyFeaturesCrud } from "@/modules/car-attributes/safety-features.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cars/safety-features/{id}:
 *   patch: { tags: [Car Attributes], summary: Update a safety feature, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Car Attributes], summary: Delete a safety feature, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  return ok(await safetyFeaturesCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cars.attributes.manage");
  const { id } = await params;
  await safetyFeaturesCrud.remove(id);
  return noContent();
});
