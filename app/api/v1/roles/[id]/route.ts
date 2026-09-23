import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { updateRoleSchema } from "@/modules/roles/roles.schemas";
import { deleteRole, getRole, updateRole } from "@/modules/roles/roles.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get a role by id
 *     responses:
 *       200: { description: Role. }
 *   patch:
 *     tags: [Roles]
 *     summary: Update a role's label/description/permissions
 *     responses:
 *       200: { description: Updated role. }
 *   delete:
 *     tags: [Roles]
 *     summary: Delete a non-system role with no assigned users
 *     responses:
 *       204: { description: Deleted. }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("roles.manage");
  const { id } = await params;
  return ok(await getRole(id));
});

export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("roles.manage");
  const { id } = await params;
  const body = updateRoleSchema.parse(await req.json());
  return ok(await updateRole(id, body));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("roles.manage");
  const { id } = await params;
  await deleteRole(id);
  return noContent();
});
