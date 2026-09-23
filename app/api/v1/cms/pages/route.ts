import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { createPageSchema } from "@/modules/cms/pages.schemas";
import { createPage, listPages } from "@/modules/cms/pages.service";

/**
 * @swagger
 * /cms/pages:
 *   get: { tags: [CMS], summary: List CMS pages, responses: { 200: { description: Paginated. } } }
 *   post: { tags: [CMS], summary: Create a CMS page, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cms.manage");
  const { data, meta } = await listPages(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cms.manage");
  const body = createPageSchema.parse(await req.json());
  return created(await createPage(body));
});
