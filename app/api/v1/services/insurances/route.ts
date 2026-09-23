import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { insurancesCrud } from "@/modules/services/insurances.crud";

/**
 * @swagger
 * /services/insurances:
 *   get: { tags: [Services], summary: List insurance options (public), responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Services], summary: Create an insurance option, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  const { data, meta } = await insurancesCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("insurances.manage");
  return created(await insurancesCrud.create(req));
});
