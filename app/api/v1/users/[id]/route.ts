import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { updateUserSchema } from "@/modules/users/users.schemas";
import { deleteUser, getUser, updateUser } from "@/modules/users/users.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by id
 *     responses:
 *       200: { description: User. }
 *   patch:
 *     tags: [Users]
 *     summary: Update a user
 *     responses:
 *       200: { description: Updated user. }
 *   delete:
 *     tags: [Users]
 *     summary: Deactivate a user (soft delete)
 *     responses:
 *       204: { description: Deactivated. }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("users.manage");
  const { id } = await params;
  return ok(await getUser(id));
});

export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("users.manage");
  const { id } = await params;
  const body = updateUserSchema.parse(await req.json());
  return ok(await updateUser(id, body));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("users.manage");
  const { id } = await params;
  await deleteUser(id);
  return noContent();
});
