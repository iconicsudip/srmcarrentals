import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { createAirportChargeSchema } from "@/modules/airports/airport-charges.schemas";
import { createAirportCharge, listAirportCharges } from "@/modules/airports/airport-charges.service";

/**
 * @swagger
 * /airports/charges:
 *   get:
 *     tags: [Airports]
 *     summary: List airport <-> location pickup/drop charges
 *     responses: { 200: { description: Paginated. } }
 *   post:
 *     tags: [Airports]
 *     summary: Create an airport <-> location charge
 *     responses: { 201: { description: Created. } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("airports.manage");
  const { data, meta } = await listAirportCharges(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("airports.manage");
  const body = createAirportChargeSchema.parse(await req.json());
  return created(await createAirportCharge(body));
});
