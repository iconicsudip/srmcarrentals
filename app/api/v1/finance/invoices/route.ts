import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok, paginated } from "@/lib/http/api-response";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("invoices.view");
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
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customer: { firstName: { contains: search, mode: "insensitive" } } },
      { customer: { lastName: { contains: search, mode: "insensitive" } } },
      { booking: { bookingReference: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingReference: true,
            status: true,
            car: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return paginated(invoices, buildPaginationMeta(page, limit, total));
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("invoices.view");
  const body = await req.json();

  const invoiceNumber =
    body.invoiceNumber ||
    `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const invoice = await prisma.invoice.create({
    data: {
      bookingId: body.bookingId,
      customerId: body.customerId,
      invoiceNumber,
      amount: body.amount,
      taxAmount: body.taxAmount || 0,
      totalAmount: body.totalAmount || body.amount,
      status: body.status || "ISSUED",
      issuedAt: new Date(),
      pdfUrl: body.pdfUrl || null,
    },
    include: {
      customer: true,
      booking: true,
    },
  });

  return ok(invoice);
});
