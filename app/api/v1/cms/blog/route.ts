import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok, paginated } from "@/lib/http/api-response";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { BlogStatus } from "@prisma/client";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("blog.manage");
  const url = new URL(req.url);
  const { page, limit, skip } = parsePagination(req.url);
  const status = url.searchParams.get("status") as BlogStatus | null;
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const search = url.searchParams.get("search") || undefined;

  const where: any = {};
  if (status && (status as any) !== "ALL") {
    where.status = status;
  }
  if (categoryId && categoryId !== "ALL") {
    where.categoryId = categoryId;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, blogs] = await Promise.all([
    prisma.blog.count({ where }),
    prisma.blog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  return paginated(blogs, buildPaginationMeta(page, limit, total));
});

export const POST = withErrorHandling(async (req) => {
  const session = await requirePermission("blog.manage");
  const body = await req.json();

  const slug =
    body.slug ||
    body.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-");

  const authorId = body.authorId || session.sub;

  const blog = await prisma.blog.create({
    data: {
      title: body.title,
      slug,
      featuredImage: body.featuredImage || null,
      content: body.content || "",
      authorId,
      categoryId: body.categoryId,
      tags: Array.isArray(body.tags) ? body.tags : [],
      status: body.status || "DRAFT",
      publishDate: body.status === "PUBLISHED" ? new Date() : null,
    },
    include: {
      category: true,
      author: true,
    },
  });

  return ok(blog);
});

export const PUT = withErrorHandling(async (req) => {
  await requirePermission("blog.manage");
  const body = await req.json();
  const { id, ...data } = body;

  if (data.status === "PUBLISHED" && !data.publishDate) {
    data.publishDate = new Date();
  }

  const updated = await prisma.blog.update({
    where: { id },
    data,
    include: {
      category: true,
      author: true,
    },
  });

  return ok(updated);
});

export const DELETE = withErrorHandling(async (req) => {
  await requirePermission("blog.manage");
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) throw new Error("Missing blog ID");

  await prisma.blog.delete({
    where: { id },
  });

  return ok({ deleted: true });
});
