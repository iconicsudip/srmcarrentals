import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://srmcarrentals.in";

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "seo.robots" },
    });

    if (setting && setting.value) {
      const config = setting.value as any;
      const rules: MetadataRoute.Robots["rules"] = [
        {
          userAgent: "*",
          allow: config.defaultAllow || ["/"],
          disallow: config.defaultDisallow || ["/admin", "/api"],
          crawlDelay: config.crawlDelay || undefined,
        },
      ];

      // Add specific AI bot rules
      if (Array.isArray(config.aiBots)) {
        for (const bot of config.aiBots) {
          if (!bot.allowed) {
            (rules as any[]).push({
              userAgent: bot.userAgent,
              disallow: ["/"],
            });
          } else {
            (rules as any[]).push({
              userAgent: bot.userAgent,
              allow: ["/"],
              disallow: config.defaultDisallow || ["/admin", "/api"],
            });
          }
        }
      }

      return {
        rules,
        sitemap: config.sitemapUrl?.startsWith("http")
          ? config.sitemapUrl
          : `${appUrl}${config.sitemapUrl || "/sitemap.xml"}`,
        host: config.host || appUrl,
      };
    }
  } catch {
    // Fallback if DB is unavailable during early boot
  }

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
