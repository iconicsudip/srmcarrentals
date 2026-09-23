import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { updateRentalPackageSchema } from "@/modules/pricing/packages.schemas";
import { deleteRentalPackage, updateRentalPackage } from "@/modules/pricing/packages.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /pricing/packages/{id}:
 *   patch: { tags: [Pricing], summary: Update a rental package, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Pricing], summary: Delete a rental package, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("pricing.packages.manage");
  const { id } = await params;
  const body = updateRentalPackageSchema.parse(await req.json());
  return ok(await updateRentalPackage(id, body));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("pricing.packages.manage");
  const { id } = await params;
  await deleteRentalPackage(id);
  return noContent();
});
