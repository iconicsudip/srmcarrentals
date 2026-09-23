import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { modelsCrud } from "@/modules/car-attributes/models.crud";

/**
 * @swagger
 * /cars/models:
 *   get:
 *     tags: [Car Attributes]
 *     summary: List car models (paginated, searchable, filterable by ?brandId=)
 *     responses: { 200: { description: Paginated models. } }
 *   post:
 *     tags: [Car Attributes]
 *     summary: Create a car model
 *     responses: { 201: { description: Created. } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await modelsCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await modelsCrud.create(req));
});
