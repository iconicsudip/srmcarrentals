import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok, paginated } from "@/lib/http/api-response";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("refunds.manage");
  const url = new URL(req.url);
  const { page, limit, skip } = parsePagination(req.url);
  const status = url.searchParams.get("status") || undefined;

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  const [total, refunds] = await Promise.all([
    prisma.refund.count({ where }),
    prisma.refund.findMany({
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
                id: true,
                bookingReference: true,
                customer: { select: { firstName: true, lastName: true, phone: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return paginated(refunds, buildPaginationMeta(page, limit, total));
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("refunds.manage");
  const body = await req.json();

  const refund = await prisma.refund.create({
    data: {
      paymentId: body.paymentId,
      amount: body.amount,
      reason: body.reason || "Security Deposit Release",
      status: body.status || "PROCESSED",
      providerRefundId: body.providerRefundId || `ref_${Date.now()}`,
      processedAt: new Date(),
    },
  });

  return ok(refund);
});
