import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";

/**
 * @swagger
 * /permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: List all permissions, grouped by module
 *     responses:
 *       200: { description: All permissions. }
 */
export const GET = withErrorHandling(async () => {
  await requirePermission("permissions.manage");
  const permissions = await prisma.permission.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  return ok(permissions);
});
