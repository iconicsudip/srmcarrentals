import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { toursCrud } from "@/modules/website/tours.crud";

/**
 * @swagger
 * /website/tours:
 *   get: { tags: [Website], summary: List tours (public), responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Website], summary: Create a tour, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  const { data, meta } = await toursCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("tours.manage");
  return created(await toursCrud.create(req));
});
