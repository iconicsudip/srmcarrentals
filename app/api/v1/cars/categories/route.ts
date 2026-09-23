import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { categoriesCrud } from "@/modules/car-attributes/categories.crud";

/**
 * @swagger
 * /cars/categories:
 *   get: { tags: [Car Attributes], summary: List car categories, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a car category, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await categoriesCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await categoriesCrud.create(req));
});
