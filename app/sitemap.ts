import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://srmcarrentals.in";

  try {
    const [cars, categories, locations, airports, blogs, pages, pageSettings, customPagesSetting] =
      await Promise.all([
        prisma.car.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
        prisma.carCategory.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
        prisma.location.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
        prisma.airport.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
        prisma.blog.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
        prisma.page.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
        prisma.setting.findMany({ where: { group: "seo.page" } }),
        prisma.setting.findUnique({ where: { key: "seo.custom_pages" } }),
      ]);

    // Build map of custom SEO overrides per path
    const overrides = new Map<string, any>();
    for (const s of pageSettings) {
      if (s.value && typeof s.value === "object") {
        const val = s.value as any;
        if (val.path) overrides.set(val.path, val);
      }
    }

    const staticPaths = [
      "",
      "/cars",
      "/locations",
      "/airports",
      "/tours",
      "/about-us",
      "/contact-us",
      "/faq",
      "/terms-and-conditions",
      "/privacy-policy",
      "/cancellation-policy",
      "/blog",
    ];

    const entries: MetadataRoute.Sitemap = [];

    // Helper to evaluate entry
    const addEntry = (path: string, lastMod: Date, defaultPriority: number, defaultFreq: any) => {
      const override = overrides.get(path === "" ? "/" : path);
      if (override && override.inSitemap === false) {
        return; // Excluded by admin
      }
      entries.push({
        url: `${appUrl}${path}`,
        lastModified: override?.lastModified ? new Date(override.lastModified) : lastMod,
        priority: override?.sitemapPriority !== undefined ? Number(override.sitemapPriority) : defaultPriority,
        changeFrequency: override?.sitemapChangeFreq || defaultFreq,
      });
    };

    // 1. Static routes
    for (const sp of staticPaths) {
      addEntry(sp, new Date(), sp === "" ? 1.0 : 0.8, "daily");
    }

    // 2. Cars
    for (const c of cars) {
      addEntry(`/car/${c.slug}`, c.updatedAt, 0.9, "daily");
    }

    // 3. Categories
    for (const cat of categories) {
      addEntry(`/cars/${cat.slug}`, cat.updatedAt, 0.7, "weekly");
    }

    // 4. Locations
    for (const l of locations) {
      addEntry(`/car-rental/${l.slug}`, l.updatedAt, 0.8, "daily");
    }

    // 5. Airports
    for (const a of airports) {
      addEntry(`/airport-transfer/${a.slug}`, a.updatedAt, 0.8, "daily");
    }

    // 6. Blogs
    for (const b of blogs) {
      addEntry(`/blog/${b.slug}`, b.updatedAt, 0.7, "weekly");
    }

    // 7. CMS Pages
    for (const p of pages) {
      addEntry(`/${p.slug}`, p.updatedAt, 0.6, "monthly");
    }

    // 8. Custom Pages
    if (customPagesSetting?.value && Array.isArray(customPagesSetting.value)) {
      for (const cp of customPagesSetting.value as any[]) {
        if (cp.path) {
          addEntry(cp.path, new Date(), 0.7, "weekly");
        }
      }
    }

    return entries;
  } catch {
    // Basic fallback
    return [
      { url: `${appUrl}`, lastModified: new Date(), priority: 1.0, changeFrequency: "daily" },
      { url: `${appUrl}/cars`, lastModified: new Date(), priority: 0.8, changeFrequency: "daily" },
    ];
  }
}
