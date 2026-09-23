import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { locationsCrud } from "@/modules/locations/locations.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /locations/{id}:
 *   patch: { tags: [Locations], summary: Update a location, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Locations], summary: Delete a location, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("locations.manage");
  const { id } = await params;
  return ok(await locationsCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("locations.manage");
  const { id } = await params;
  await locationsCrud.remove(id);
  return noContent();
});
