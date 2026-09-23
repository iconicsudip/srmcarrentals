import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { airportsCrud } from "@/modules/airports/airports.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /airports/{id}:
 *   patch: { tags: [Airports], summary: Update an airport, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Airports], summary: Delete an airport, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("airports.manage");
  const { id } = await params;
  return ok(await airportsCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("airports.manage");
  const { id } = await params;
  await airportsCrud.remove(id);
  return noContent();
});
