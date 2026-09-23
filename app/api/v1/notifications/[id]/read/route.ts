import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { noContent } from "@/lib/http/api-response";
import { ForbiddenError, NotFoundError } from "@/lib/http/errors";
import { withErrorHandling } from "@/lib/http/with-error-handling";

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Marked as read. }
 */
export const PATCH = withErrorHandling<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const session = await requireSession();
  const { id } = await params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new NotFoundError("Notification not found");
  if (notification.userId && notification.userId !== session.sub) {
    throw new ForbiddenError();
  }

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return noContent();
});
