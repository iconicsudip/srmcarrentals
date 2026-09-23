import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { seasonalPricingCrud } from "@/modules/pricing/seasonal.service";

/**
 * @swagger
 * /pricing/seasonal:
 *   get: { tags: [Pricing], summary: List seasonal pricing rules, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Pricing], summary: Create a seasonal pricing rule, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("pricing.seasonal.manage");
  const { data, meta } = await seasonalPricingCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("pricing.seasonal.manage");
  return created(await seasonalPricingCrud.create(req));
});
