import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { couponsCrud } from "@/modules/marketing/coupons.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /coupons/{id}:
 *   get: { tags: [Marketing], summary: Get coupon by id, responses: { 200: { description: Coupon. } } }
 *   patch: { tags: [Marketing], summary: Update coupon, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Marketing], summary: Delete coupon, responses: { 204: { description: Deleted. } } }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("coupons.manage");
  const { id } = await params;
  return ok(await couponsCrud.getOrThrow(id));
});

export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("coupons.manage");
  const { id } = await params;
  return ok(await couponsCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("coupons.manage");
  const { id } = await params;
  await couponsCrud.remove(id);
  return noContent();
});
