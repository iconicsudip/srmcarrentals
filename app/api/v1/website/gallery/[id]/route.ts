import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { galleryCrud } from "@/modules/website/gallery.crud";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /website/gallery/{id}:
 *   patch: { tags: [Website], summary: Update a gallery image, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Website], summary: Delete a gallery image, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("gallery.manage");
  const { id } = await params;
  return ok(await galleryCrud.update(req, id));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("gallery.manage");
  const { id } = await params;
  await galleryCrud.remove(id);
  return noContent();
});
