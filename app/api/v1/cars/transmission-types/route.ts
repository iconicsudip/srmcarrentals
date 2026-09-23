import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { transmissionTypesCrud } from "@/modules/car-attributes/transmission-types.crud";

/**
 * @swagger
 * /cars/transmission-types:
 *   get: { tags: [Car Attributes], summary: List transmission types, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a transmission type, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await transmissionTypesCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await transmissionTypesCrud.create(req));
});
