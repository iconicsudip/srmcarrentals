import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { testimonialsCrud } from "@/modules/website/testimonials.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /website/testimonials/{id}:
 *   patch: { tags: [Website], summary: Update a testimonial, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Website], summary: Delete a testimonial, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("testimonials.manage");
  const { id } = await params;
  return ok(await testimonialsCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("testimonials.manage");
  const { id } = await params;
  await testimonialsCrud.remove(id);
  return noContent();
});
