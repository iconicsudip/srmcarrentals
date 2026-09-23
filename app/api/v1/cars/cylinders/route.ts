import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { cylindersCrud } from "@/modules/car-attributes/cylinders.crud";

/**
 * @swagger
 * /cars/cylinders:
 *   get: { tags: [Car Attributes], summary: List cylinder options, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a cylinder option, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await cylindersCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await cylindersCrud.create(req));
});
