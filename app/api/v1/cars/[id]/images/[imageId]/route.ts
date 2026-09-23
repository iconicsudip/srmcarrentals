import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { carImageMetaSchema } from "@/modules/cars/cars.schemas";
import { deleteCarImage, updateCarImage } from "@/modules/cars/car-images.service";

type Ctx = { params: Promise<{ id: string; imageId: string }> };

/**
 * @swagger
 * /cars/{id}/images/{imageId}:
 *   patch: { tags: [Cars], summary: Update alt text / featured flag on a gallery image, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Cars], summary: Delete a gallery image, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cars.edit");
  const { id, imageId } = await params;
  const body = carImageMetaSchema.parse(await req.json());
  return ok(await updateCarImage(id, imageId, body));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cars.edit");
  const { id, imageId } = await params;
  await deleteCarImage(id, imageId);
  return noContent();
});
