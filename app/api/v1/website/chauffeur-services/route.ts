import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { chauffeurServicesCrud } from "@/modules/website/chauffeur-services.crud";

/**
 * @swagger
 * /website/chauffeur-services:
 *   get: { tags: [Website], summary: List chauffeur services (public), responses: { 200: { description: Paginated. } } }
 *   post: { tags: [Website], summary: Create a chauffeur service, responses: { 201: { description: Created. } } }
 */
export const GET = withErrorHandling(async (req) => {
  const { data, meta } = await chauffeurServicesCrud.list(req);
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("chauffeur_services.manage");
  return created(await chauffeurServicesCrud.create(req));
});
