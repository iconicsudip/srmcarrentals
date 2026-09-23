import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { paginated } from "@/lib/http/api-response";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("payments.view");
  const url = new URL(req.url);
  const { page, limit, skip } = parsePagination(req.url);
  const search = url.searchParams.get("search") || undefined;

  const where: any = {};
  if (search) {
    where.OR = [
      { providerReference: { contains: search, mode: "insensitive" } },
      { payment: { booking: { bookingReference: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        payment: {
          select: {
            id: true,
            provider: true,
            booking: {
              select: {
                bookingReference: true,
                customer: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return paginated(transactions, buildPaginationMeta(page, limit, total));
});
