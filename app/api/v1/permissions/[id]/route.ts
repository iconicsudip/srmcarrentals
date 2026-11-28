import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { noContent } from "@/lib/http/api-response";
import { BadRequestError, NotFoundError } from "@/lib/http/errors";
import { withErrorHandling } from "@/lib/http/with-error-handling";

type Ctx = { params: Promise<{ id: string }> };

/** Delete a custom permission. Built-in permissions are used by the code and cannot be removed. */
export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("permissions.manage");
  const { id } = await params;
  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) throw new NotFoundError("Permission not found");
  if (permission.isSystem) throw new BadRequestError("Built-in permissions cannot be deleted");
  await prisma.permission.delete({ where: { id } });
  return noContent();
});
