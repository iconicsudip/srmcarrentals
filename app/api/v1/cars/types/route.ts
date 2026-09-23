import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { typesCrud } from "@/modules/car-attributes/types.crud";

/**
 * @swagger
 * /cars/types:
 *   get: { tags: [Car Attributes], summary: List car types, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a car type, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await typesCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await typesCrud.create(req));
});
