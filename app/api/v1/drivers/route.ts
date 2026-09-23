import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { driversCrud } from "@/modules/drivers/drivers.crud";

/**
 * @swagger
 * /drivers:
 *   get: { tags: [Drivers], summary: List drivers, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Drivers], summary: Create a driver, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("drivers.view");
  const { data, meta } = await driversCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("drivers.manage");
  return created(await driversCrud.create(req));
});
