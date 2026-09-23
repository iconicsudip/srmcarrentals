import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { paginated } from "@/lib/http/api-response";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { withErrorHandling } from "@/lib/http/with-error-handling";

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the current user's notifications (paginated)
 *     responses:
 *       200: { description: Paginated notifications. }
 */
export const GET = withErrorHandling(async (req) => {
  const session = await requireSession();
  const { page, limit, skip, take } = parsePagination(req.url);

  const [data, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { OR: [{ userId: session.sub }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.notification.count({ where: { OR: [{ userId: session.sub }, { userId: null }] } }),
  ]);

  return paginated(data, buildPaginationMeta(page, limit, total));
});
