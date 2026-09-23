import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { SeoEntityType } from "@prisma/client";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType") as SeoEntityType | null;
  const entityId = url.searchParams.get("entityId") || null;

  if (entityType) {
    const meta = await prisma.seoMetadata.findFirst({
      where: {
        entityType,
        entityId: entityId || null,
      },
    });
    return ok(meta);
  }

  const all = await prisma.seoMetadata.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      car: { select: { id: true, name: true, slug: true } },
      location: { select: { id: true, name: true, slug: true } },
      airport: { select: { id: true, name: true, code: true } },
      blog: { select: { id: true, title: true, slug: true } },
    },
  });

  return ok(all);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const body = await req.json();

  const entityType = body.entityType as SeoEntityType;
  const entityId = body.entityId || null;

  const data: any = {
    entityType,
    entityId,
    metaTitle: body.metaTitle || null,
    metaDescription: body.metaDescription || null,
    metaKeywords: body.metaKeywords || null,
    canonicalUrl: body.canonicalUrl || null,
    robotsMeta: body.robotsMeta || "INDEX_FOLLOW",
    ogTitle: body.ogTitle || body.metaTitle || null,
    ogDescription: body.ogDescription || body.metaDescription || null,
    ogImage: body.ogImage || null,
    twitterCard: body.twitterCard || "summary_large_image",
  };

  // Map concrete relation fields
  if (entityType === "CAR" && entityId) data.carId = entityId;
  if (entityType === "LOCATION" && entityId) data.locationId = entityId;
  if (entityType === "AIRPORT" && entityId) data.airportId = entityId;
  if (entityType === "BLOG_POST" && entityId) data.blogId = entityId;
  if (entityType === "PAGE" && entityId) data.pageId = entityId;

  const existing = await prisma.seoMetadata.findFirst({
    where: {
      entityType,
      entityId,
    },
  });

  let result;
  if (existing) {
    result = await prisma.seoMetadata.update({
      where: { id: existing.id },
      data,
    });
  } else {
    result = await prisma.seoMetadata.create({
      data,
    });
  }

  return ok(result);
});
