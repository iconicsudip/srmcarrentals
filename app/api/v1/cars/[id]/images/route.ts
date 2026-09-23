import { requirePermission } from "@/lib/auth/rbac";
import { BadRequestError } from "@/lib/http/errors";
import { created, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { listCarImages, uploadCarImage } from "@/modules/cars/car-images.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cars/{id}/images:
 *   get:
 *     tags: [Cars]
 *     summary: List a car's gallery images (ordered)
 *     responses: { 200: { description: Images. } }
 *   post:
 *     tags: [Cars]
 *     summary: Upload a gallery image (multipart/form-data, field "file"; optional "altText")
 *     responses: { 201: { description: Uploaded image. } }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cars.view");
  const { id } = await params;
  return ok(await listCarImages(id));
});

export const POST = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cars.edit");
  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new BadRequestError("Missing image file");
  }
  const altText = formData.get("altText");

  return created(await uploadCarImage(id, file, typeof altText === "string" ? altText : undefined));
});
