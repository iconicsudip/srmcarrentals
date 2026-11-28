import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { created, ok } from "@/lib/http/api-response";
import { BadRequestError } from "@/lib/http/errors";
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

/** Create a custom permission (e.g. "reports.view"). Built-in ones are seeded; custom ones can be attached to roles and removed again. */
export const POST = withErrorHandling(async (req) => {
  await requirePermission("permissions.manage");
  const body = (await req.json()) as { key?: string; group?: string; description?: string };
  const key = (body.key ?? "").trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(key)) {
    throw new BadRequestError('Use a key like "reports.view": lower-case words joined by dots');
  }
  if (await prisma.permission.findUnique({ where: { key } })) throw new BadRequestError("That permission already exists");
  const group = (body.group ?? "").trim().toLowerCase() || key.split(".")[0]!;
  return created(await prisma.permission.create({ data: { key, group, description: body.description?.trim() || null, isSystem: false } }));
});
