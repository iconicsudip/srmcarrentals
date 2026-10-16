import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { uniqueSlug } from "@/lib/slug";
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

  const slug = await uniqueSlug(body.slug || body.name, async (c) => !!(await prisma.blogCategory.findUnique({ where: { slug: c }, select: { id: true } })));

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

  if (typeof data.slug === "string" && data.slug.trim()) {
    data.slug = await uniqueSlug(data.slug, async (c) => {
      const hit = await prisma.blogCategory.findUnique({ where: { slug: c }, select: { id: true } });
      return !!hit && hit.id !== id;
    });
  } else {
    delete data.slug;
  }

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
