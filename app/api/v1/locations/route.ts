import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { locationsCrud } from "@/modules/locations/locations.crud";

/**
 * @swagger
 * /locations:
 *   get:
 *     tags: [Locations]
 *     summary: List locations (public — used by the booking flow's pickup/drop pickers)
 *     responses: { 200: { description: Paginated. } }
 *   post: { tags: [Locations], summary: Create a location, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  const { data, meta } = await locationsCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("locations.manage");
  return created(await locationsCrud.create(req));
});
