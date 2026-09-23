import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { fuelTypesCrud } from "@/modules/car-attributes/fuel-types.crud";

/**
 * @swagger
 * /cars/fuel-types:
 *   get: { tags: [Car Attributes], summary: List fuel types, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a fuel type, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await fuelTypesCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await fuelTypesCrud.create(req));
});
