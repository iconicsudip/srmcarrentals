import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { reorderImagesSchema } from "@/modules/cars/cars.schemas";
import { reorderCarImages } from "@/modules/cars/car-images.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cars/{id}/images/reorder:
 *   patch:
 *     tags: [Cars]
 *     summary: Persist a new drag-and-drop sort order for a car's gallery images
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { order: { type: array, items: { type: string } } } }
 *     responses: { 200: { description: Reordered images. } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cars.edit");
  const { id } = await params;
  const { order } = reorderImagesSchema.parse(await req.json());
  return ok(await reorderCarImages(id, order));
});
