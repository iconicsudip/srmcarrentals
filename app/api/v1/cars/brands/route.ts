import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { brandsCrud } from "@/modules/car-attributes/brands.crud";

/**
 * @swagger
 * /cars/brands:
 *   get:
 *     tags: [Car Attributes]
 *     summary: List car brands (paginated, searchable)
 *     responses: { 200: { description: Paginated brands. } }
 *   post:
 *     tags: [Car Attributes]
 *     summary: Create a car brand
 *     responses: { 201: { description: Created. } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await brandsCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await brandsCrud.create(req));
});
