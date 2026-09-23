import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { steeringTypesCrud } from "@/modules/car-attributes/steering-types.crud";

/**
 * @swagger
 * /cars/steering-types:
 *   get: { tags: [Car Attributes], summary: List steering types, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a steering type, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await steeringTypesCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await steeringTypesCrud.create(req));
});
