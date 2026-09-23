import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { extraServicesCrud } from "@/modules/services/extra-services.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /services/extra-services/{id}:
 *   patch: { tags: [Services], summary: Update an extra service, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Services], summary: Delete an extra service, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("extra_services.manage");
  const { id } = await params;
  return ok(await extraServicesCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("extra_services.manage");
  const { id } = await params;
  await extraServicesCrud.remove(id);
  return noContent();
});
