import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { featuresCrud } from "@/modules/car-attributes/features.crud";

/**
 * @swagger
 * /cars/features:
 *   get: { tags: [Car Attributes], summary: List car features, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a car feature, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await featuresCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await featuresCrud.create(req));
});
