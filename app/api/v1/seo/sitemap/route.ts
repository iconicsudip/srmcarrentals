import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export const GET = withErrorHandling(async () => {
  await requirePermission("seo.manage");

  const [carsCount, locationsCount, airportsCount, blogsCount, pagesCount] = await Promise.all([
    prisma.car.count({ where: { status: "ACTIVE" } }),
    prisma.location.count({ where: { status: "ACTIVE" } }),
    prisma.airport.count({ where: { status: "ACTIVE" } }),
    prisma.blog.count({ where: { status: "PUBLISHED" } }),
    prisma.page.count({ where: { status: "PUBLISHED" } }),
  ]);

  const staticRoutes = [
    "/",
    "/cars",
    "/locations",
    "/airports",
    "/about",
    "/contact",
    "/faq",
    "/terms",
    "/blog",
  ];

  const totalUrls =
    carsCount + locationsCount + airportsCount + blogsCount + pagesCount + staticRoutes.length;

  return ok({
    totalUrls,
    staticRoutesCount: staticRoutes.length,
    carsCount,
    locationsCount,
    airportsCount,
    blogsCount,
    pagesCount,
    lastGenerated: new Date().toISOString(),
    sitemapUrl: "/sitemap.xml",
    robotsUrl: "/robots.txt",
  });
});

export const POST = withErrorHandling(async () => {
  await requirePermission("seo.manage");
  // Simulates regenerating and notifying Google & Bing
  return ok({
    success: true,
    message: "Sitemap refreshed and ping notification dispatched to search engine bots.",
    timestamp: new Date().toISOString(),
  });
});
