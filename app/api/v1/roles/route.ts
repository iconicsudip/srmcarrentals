import { requirePermission } from "@/lib/auth/rbac";
import { created, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { createRoleSchema } from "@/modules/roles/roles.schemas";
import { createRole, listRoles } from "@/modules/roles/roles.service";

/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: List all roles with their permissions
 *     responses:
 *       200: { description: List of roles. }
 *   post:
 *     tags: [Roles]
 *     summary: Create a role
 *     responses:
 *       201: { description: Role created. }
 */
export const GET = withErrorHandling(async () => {
  await requirePermission("roles.manage");
  return ok(await listRoles());
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("roles.manage");
  const body = createRoleSchema.parse(await req.json());
  return created(await createRole(body));
});
