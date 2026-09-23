import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { carPricingSchema } from "@/modules/pricing/car-pricing.schemas";
import { getCarPricing, upsertCarPricing } from "@/modules/pricing/car-pricing.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cars/{id}/pricing:
 *   get:
 *     tags: [Pricing]
 *     summary: Get a car's pricing configuration (24-hour, hourly, KM, grace period)
 *     responses: { 200: { description: Pricing config, or null if unset. } }
 *   put:
 *     tags: [Pricing]
 *     summary: Create/update a car's pricing configuration
 *     responses: { 200: { description: Saved. } }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("pricing.manage");
  const { id } = await params;
  return ok(await getCarPricing(id));
});

export const PUT = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("pricing.manage");
  const { id } = await params;
  const body = carPricingSchema.parse(await req.json());
  return ok(await upsertCarPricing(id, body));
});
