import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok, paginated } from "@/lib/http/api-response";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("activity_logs.view");
  const url = new URL(req.url);
  const { page, limit, skip } = parsePagination(req.url);
  const action = url.searchParams.get("action") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const where: any = {};
  if (action && action !== "ALL") {
    where.action = action;
  }
  if (search) {
    where.OR = [
      { entityType: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      { user: { firstName: { contains: search, mode: "insensitive" } } },
      { user: { lastName: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return paginated(logs, buildPaginationMeta(page, limit, total));
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("activity_logs.view");
  const body = await req.json();

  const log = await prisma.auditLog.create({
    data: {
      userId: body.userId || null,
      action: body.action || "UPDATE",
      entityType: body.entityType || "SYSTEM",
      entityId: body.entityId || null,
      changes: body.changes || null,
      ipAddress: body.ipAddress || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || undefined,
    },
  });

  return ok(log);
});
