import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { customersCrud } from "@/modules/customers/customers.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /customers/{id}:
 *   patch: { tags: [Customers], summary: Update a customer, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Customers], summary: Delete a customer, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("customers.manage");
  const { id } = await params;
  return ok(await customersCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("customers.manage");
  const { id } = await params;
  await customersCrud.remove(id);
  return noContent();
});
