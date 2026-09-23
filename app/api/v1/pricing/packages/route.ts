import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { createRentalPackageSchema } from "@/modules/pricing/packages.schemas";
import { createRentalPackage, listRentalPackages } from "@/modules/pricing/packages.service";

/**
 * @swagger
 * /pricing/packages:
 *   get:
 *     tags: [Pricing]
 *     summary: List rental packages (public — used by the booking flow to offer packages)
 *     responses: { 200: { description: Paginated. } }
 *   post: { tags: [Pricing], summary: Create a rental package, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  const { data, meta } = await listRentalPackages(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("pricing.packages.manage");
  const body = createRentalPackageSchema.parse(await req.json());
  return created(await createRentalPackage(body));
});
