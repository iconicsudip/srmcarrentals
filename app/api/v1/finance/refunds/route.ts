import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok, paginated } from "@/lib/http/api-response";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { BadRequestError } from "@/lib/http/errors";
import { refundPayment } from "@/modules/payments/refunds.service";

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

/** Refund (part of) a payment — through Razorpay for online payments, or record a manual refund. */
export const POST = withErrorHandling(async (req) => {
  await requirePermission("refunds.manage");
  const body = (await req.json()) as { paymentId?: string; amount?: number | string; reason?: string; manual?: boolean };
  if (!body.paymentId) throw new BadRequestError("paymentId is required");
  const amount = body.amount === undefined || body.amount === "" ? undefined : Number(body.amount);
  if (amount !== undefined && !Number.isFinite(amount)) throw new BadRequestError("Invalid refund amount");
  return ok(await refundPayment({ paymentId: body.paymentId, amount, reason: body.reason, manual: Boolean(body.manual) }));
});
