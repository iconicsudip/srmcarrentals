import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok, paginated } from "@/lib/http/api-response";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("payments.view");
  const url = new URL(req.url);
  const { page, limit, skip } = parsePagination(req.url);
  const status = url.searchParams.get("status") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { booking: { bookingReference: { contains: search, mode: "insensitive" } } },
      { booking: { customer: { firstName: { contains: search, mode: "insensitive" } } } },
      { booking: { customer: { lastName: { contains: search, mode: "insensitive" } } } },
      { providerPaymentId: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            status: true,
            customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
            car: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return paginated(payments, buildPaginationMeta(page, limit, total));
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("payments.view");
  const body = await req.json();

  const payment = await prisma.payment.create({
    data: {
      bookingId: body.bookingId,
      provider: body.provider || "CASH",
      paymentType: body.paymentType || "FULL",
      amount: body.amount,
      currency: body.currency || "INR",
      status: body.status || "COMPLETED",
      providerPaymentId: body.providerPaymentId || `manual_${Date.now()}`,
      paidAt: new Date(),
    },
  });

  return ok(payment);
});
