import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { tourCategoriesCrud } from "@/modules/website/tour-categories.crud";

/**
 * @swagger
 * /website/tour-categories:
 *   get: { tags: [Website], summary: List tour categories (public), responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Website], summary: Create a tour category, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  const { data, meta } = await tourCategoriesCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("tours.manage");
  return created(await tourCategoriesCrud.create(req));
});
