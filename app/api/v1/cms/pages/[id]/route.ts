import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { updatePageSchema } from "@/modules/cms/pages.schemas";
import { deletePage, updatePage } from "@/modules/cms/pages.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cms/pages/{id}:
 *   patch: { tags: [CMS], summary: Update a CMS page, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [CMS], summary: Delete a CMS page, responses: { 204: { description: Deleted. } } }
 */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cms.manage");
  const { id } = await params;
  const body = updatePageSchema.parse(await req.json());
  return ok(await updatePage(id, body));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cms.manage");
  const { id } = await params;
  await deletePage(id);
  return noContent();
});
