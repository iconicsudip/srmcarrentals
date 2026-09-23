import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const url = new URL(req.url);
  const search = url.searchParams.get("search");

  const where: any = {};
  if (search) {
    where.OR = [
      { fromPath: { contains: search, mode: "insensitive" } },
      { toPath: { contains: search, mode: "insensitive" } },
    ];
  }

  const rules = await prisma.redirectRule.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return ok(rules);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const body = await req.json();

  let fromPath = body.fromPath.trim();
  if (!fromPath.startsWith("/")) fromPath = "/" + fromPath;

  let toPath = body.toPath.trim();
  if (!toPath.startsWith("/") && !toPath.startsWith("http")) toPath = "/" + toPath;

  const rule = await prisma.redirectRule.create({
    data: {
      fromPath,
      toPath,
      statusCode: Number(body.statusCode) || 301,
      status: body.status || "ACTIVE",
    },
  });

  return ok(rule);
});

export const PUT = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const body = await req.json();

  const { id, ...data } = body;
  if (data.statusCode) data.statusCode = Number(data.statusCode);

  const updated = await prisma.redirectRule.update({
    where: { id },
    data,
  });

  return ok(updated);
});

export const DELETE = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) throw new Error("Missing redirect rule ID");

  await prisma.redirectRule.delete({
    where: { id },
  });

  return ok({ deleted: true });
});
