import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { colorsCrud } from "@/modules/car-attributes/colors.crud";

/**
 * @swagger
 * /cars/colors:
 *   get: { tags: [Car Attributes], summary: List car colors, responses: { 200: { description: Paginated colors. } } }
 *   post: { tags: [Car Attributes], summary: Create a car color, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await colorsCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await colorsCrud.create(req));
});
