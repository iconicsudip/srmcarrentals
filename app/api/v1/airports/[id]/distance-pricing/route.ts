import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { distancePricingSchema } from "@/modules/airports/airport-charges.schemas";
import { getAirportDistancePricing, upsertAirportDistancePricing } from "@/modules/airports/airport-charges.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /airports/{id}/distance-pricing:
 *   get:
 *     tags: [Airports]
 *     summary: Get an airport's distance-based fallback pricing (used when no explicit location charge exists)
 *     responses: { 200: { description: Distance pricing config, or null if unset. } }
 *   put:
 *     tags: [Airports]
 *     summary: Create/update an airport's distance-based pricing
 *     responses: { 200: { description: Saved. } }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("airports.manage");
  const { id } = await params;
  return ok(await getAirportDistancePricing(id));
});

export const PUT = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("airports.manage");
  const { id } = await params;
  const body = distancePricingSchema.parse(await req.json());
  return ok(await upsertAirportDistancePricing(id, body));
});
