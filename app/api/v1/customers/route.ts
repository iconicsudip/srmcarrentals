import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { customersCrud } from "@/modules/customers/customers.crud";

/**
 * @swagger
 * /customers:
 *   get: { tags: [Customers], summary: List customers, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Customers], summary: Create a customer, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("customers.view");
  const { data, meta } = await customersCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("customers.manage");
  return created(await customersCrud.create(req));
});
