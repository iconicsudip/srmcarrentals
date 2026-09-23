import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { galleryCrud } from "@/modules/website/gallery.crud";

/**
 * @swagger
 * /website/gallery:
 *   get: { tags: [Website], summary: List gallery images (public), responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Website], summary: Add a gallery image, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  const { data, meta } = await galleryCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("gallery.manage");
  return created(await galleryCrud.create(req));
});
