import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { driversCrud } from "@/modules/drivers/drivers.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /drivers/{id}:
 *   patch: { tags: [Drivers], summary: Update a driver, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Drivers], summary: Delete a driver, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("drivers.manage");
  const { id } = await params;
  return ok(await driversCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("drivers.manage");
  const { id } = await params;
  await driversCrud.remove(id);
  return noContent();
});
