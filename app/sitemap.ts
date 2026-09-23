import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";

/** Dynamic sitemap covering static routes plus every published car, category,
 * location, airport, and blog post. Regenerated on-demand by Next.js (this
 * route is cached and revalidated like any other fetch-based route). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/cars",
    "/about-us",
    "/contact-us",
    "/faq",
    "/terms-and-conditions",
    "/privacy-policy",
    "/cancellation-policy",
    "/blog",
  ].map((path) => ({
    url: `${appUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: path === "" ? 1 : 0.7,
  }));

  const [cars, categories, locations, airports, blogs] = await Promise.all([
    prisma.car.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    prisma.carCategory.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    prisma.location.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    prisma.airport.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
    prisma.blog.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
  ]);

  return [
    ...staticRoutes,
    ...cars.map((c) => ({ url: `${appUrl}/car/${c.slug}`, lastModified: c.updatedAt, priority: 0.8 })),
    ...categories.map((c) => ({ url: `${appUrl}/cars/${c.slug}`, lastModified: c.updatedAt, priority: 0.6 })),
    ...locations.map((l) => ({ url: `${appUrl}/car-rental/${l.slug}`, lastModified: l.updatedAt, priority: 0.6 })),
    ...airports.map((a) => ({ url: `${appUrl}/airport-transfer/${a.slug}`, lastModified: a.updatedAt, priority: 0.6 })),
    ...blogs.map((b) => ({ url: `${appUrl}/blog/${b.slug}`, lastModified: b.updatedAt, priority: 0.5 })),
  ];
}
