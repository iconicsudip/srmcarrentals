import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { insurancesCrud } from "@/modules/services/insurances.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /services/insurances/{id}:
 *   patch: { tags: [Services], summary: Update an insurance option, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Services], summary: Delete an insurance option, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("insurances.manage");
  const { id } = await params;
  return ok(await insurancesCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("insurances.manage");
  const { id } = await params;
  await insurancesCrud.remove(id);
  return noContent();
});
