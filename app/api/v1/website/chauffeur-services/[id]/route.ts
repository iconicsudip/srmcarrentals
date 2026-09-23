import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { chauffeurServicesCrud } from "@/modules/website/chauffeur-services.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /website/chauffeur-services/{id}:
 *   patch: { tags: [Website], summary: Update a chauffeur service, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Website], summary: Delete a chauffeur service, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("chauffeur_services.manage");
  const { id } = await params;
  return ok(await chauffeurServicesCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("chauffeur_services.manage");
  const { id } = await params;
  await chauffeurServicesCrud.remove(id);
  return noContent();
});
