import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { tourCategoriesCrud } from "@/modules/website/tour-categories.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /website/tour-categories/{id}:
 *   patch: { tags: [Website], summary: Update a tour category, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Website], summary: Delete a tour category, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("tours.manage");
  const { id } = await params;
  return ok(await tourCategoriesCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("tours.manage");
  const { id } = await params;
  await tourCategoriesCrud.remove(id);
  return noContent();
});
