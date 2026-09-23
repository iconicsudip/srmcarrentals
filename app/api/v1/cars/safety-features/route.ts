import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { safetyFeaturesCrud } from "@/modules/car-attributes/safety-features.crud";

/**
 * @swagger
 * /cars/safety-features:
 *   get: { tags: [Car Attributes], summary: List safety features, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a safety feature, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await safetyFeaturesCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await safetyFeaturesCrud.create(req));
});
