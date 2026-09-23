import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { extraServicesCrud } from "@/modules/services/extra-services.crud";

/**
 * @swagger
 * /services/extra-services:
 *   get: { tags: [Services], summary: List extra services (public), responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Services], summary: Create an extra service, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  const { data, meta } = await extraServicesCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("extra_services.manage");
  return created(await extraServicesCrud.create(req));
});
