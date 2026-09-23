import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { airportsCrud } from "@/modules/airports/airports.crud";

/**
 * @swagger
 * /airports:
 *   get:
 *     tags: [Airports]
 *     summary: List airports (public — used by the booking flow's airport picker)
 *     responses: { 200: { description: Paginated. } }
 *   post: { tags: [Airports], summary: Create an airport, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  const { data, meta } = await airportsCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("airports.manage");
  return created(await airportsCrud.create(req));
});
