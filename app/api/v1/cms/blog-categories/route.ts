import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export const GET = withErrorHandling(async () => {
  await requirePermission("blog.manage");

  const categories = await prisma.blogCategory.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { blogs: true },
      },
    },
  });

  return ok(categories);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("blog.manage");
  const body = await req.json();

  const slug =
    body.slug ||
    body.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-");

  const category = await prisma.blogCategory.create({
    data: {
      name: body.name,
      slug,
      status: body.status || "ACTIVE",
    },
  });

  return ok(category);
});

export const PUT = withErrorHandling(async (req) => {
  await requirePermission("blog.manage");
  const body = await req.json();
  const { id, ...data } = body;

  const updated = await prisma.blogCategory.update({
    where: { id },
    data,
  });

  return ok(updated);
});

export const DELETE = withErrorHandling(async (req) => {
  await requirePermission("blog.manage");
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) throw new Error("Missing category ID");

  await prisma.blogCategory.delete({
    where: { id },
  });

  return ok({ deleted: true });
});
