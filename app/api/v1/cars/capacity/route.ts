import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { capacityCrud } from "@/modules/car-attributes/capacity.crud";

/**
 * @swagger
 * /cars/capacity:
 *   get: { tags: [Car Attributes], summary: List car capacities, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a car capacity, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await capacityCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await capacityCrud.create(req));
});
