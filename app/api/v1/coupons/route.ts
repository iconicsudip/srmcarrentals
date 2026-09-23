import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { couponsCrud } from "@/modules/marketing/coupons.crud";

/**
 * @swagger
 * /coupons:
 *   get: { tags: [Marketing], summary: List coupons, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Marketing], summary: Create a coupon, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("coupons.manage");
  const { data, meta } = await couponsCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("coupons.manage");
  return created(await couponsCrud.create(req));
});
