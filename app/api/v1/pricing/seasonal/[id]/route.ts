import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { seasonalPricingCrud } from "@/modules/pricing/seasonal.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /pricing/seasonal/{id}:
 *   patch: { tags: [Pricing], summary: Update a seasonal pricing rule, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Pricing], summary: Delete a seasonal pricing rule, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("pricing.seasonal.manage");
  const { id } = await params;
  return ok(await seasonalPricingCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("pricing.seasonal.manage");
  const { id } = await params;
  await seasonalPricingCrud.remove(id);
  return noContent();
});
