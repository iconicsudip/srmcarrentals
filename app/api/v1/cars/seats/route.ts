import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { seatsCrud } from "@/modules/car-attributes/seats.crud";

/**
 * @swagger
 * /cars/seats:
 *   get: { tags: [Car Attributes], summary: List seat options, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Car Attributes], summary: Create a seat option, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  const { data, meta } = await seatsCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.attributes.manage");
  return created(await seatsCrud.create(req));
});
