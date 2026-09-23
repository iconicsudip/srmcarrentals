import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { doorsCrud } from "@/modules/car-attributes/doors.crud";

/**
 * @swagger
 * /cars/doors:
 *   get: { tags: [Car Attributes], summary: List door options, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a door option, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await doorsCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await doorsCrud.create(req));
});
