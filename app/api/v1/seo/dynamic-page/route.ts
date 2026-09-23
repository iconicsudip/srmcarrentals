import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { SeoEntityType } from "@prisma/client";

export interface DynamicPageSeoPayload {
  path: string;
  entityType?: SeoEntityType | "CUSTOM";
  entityId?: string;

  // Meta Tags
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  robotsMeta: string; // INDEX_FOLLOW, etc.

  // Social / Open Graph / Twitter
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string; // website, article, product
  twitterCard: string; // summary_large_image, summary
  twitterCreator?: string;

  // Schema.org Structured Data
  schemaType: "AutoRental" | "Product" | "LocalBusiness" | "FAQPage" | "Article" | "BreadcrumbList" | "Organization" | "Custom";
  customSchemaJson?: string;
  enableStructuredData: boolean;

  // AEO (Answer Engine Optimization / AI Overviews)
  aeoEnabled: boolean;
  aiDirectAnswer: string; // Factual 2-3 sentence answer snippet for Perplexity / ChatGPT
  entityDefinition: string; // "What is SRM Luxury Fleet?"
  keyTakeaways: string[]; // Bullet points for AI ingestion
  faqPairs: { question: string; answer: string }[];
  aiBotDirectives: {
    allowGPTBot: boolean;
    allowPerplexityBot: boolean;
    allowClaudeBot: boolean;
    allowGoogleExtended: boolean;
  };

  // Sitemap & Indexation
  inSitemap: boolean;
  sitemapPriority: number; // 0.1 to 1.0
  sitemapChangeFreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  lastModified?: string;
}

const DEFAULT_SEO_CONFIG: DynamicPageSeoPayload = {
  path: "/",
  metaTitle: "SRM Car Rentals | Luxury & Self-Drive Car Hire India",
  metaDescription:
    "Rent premium luxury cars, SUVs, and chauffeur-driven vehicles in India. Transparent rates, airport delivery, and 24/7 support.",
  metaKeywords: "car rental india, luxury self drive, airport car hire",
  canonicalUrl: "https://srmcarrentals.in",
  robotsMeta: "INDEX_FOLLOW",
  ogTitle: "SRM Car Rentals",
  ogDescription: "The premier car rental and chauffeur service across India.",
  ogImage: "/og-image.jpg",
  ogType: "website",
  twitterCard: "summary_large_image",
  twitterCreator: "@srmcarrentals",
  schemaType: "Organization",
  enableStructuredData: true,
  aeoEnabled: true,
  aiDirectAnswer:
    "SRM Car Rentals is a luxury and self-drive car rental provider operating across major Indian travel hubs, featuring transparent pricing, airport delivery, and chauffeur packages.",
  entityDefinition: "Premier automobile hire service providing verified self-drive and chauffeur vehicles.",
  keyTakeaways: [
    "Over 50+ luxury sedans, premium SUVs, and executive vans.",
    "Doorstep and airport terminal vehicle delivery within 60 minutes.",
    "Comprehensive all-India road permits and 24/7 mechanical assistance.",
  ],
  faqPairs: [
    {
      question: "What documents are required to rent a self-drive car with SRM?",
      answer: "A valid original driving license, Aadhaar card or passport for identity verification, and a refundable security deposit.",
    },
    {
      question: "Are fuel and toll charges included in the rental cost?",
      answer: "Rates are exclusive of fuel and tolls unless booking a specialized chauffeur tour package with all-inclusive pricing.",
    },
  ],
  aiBotDirectives: {
    allowGPTBot: true,
    allowPerplexityBot: true,
    allowClaudeBot: true,
    allowGoogleExtended: true,
  },
  inSitemap: true,
  sitemapPriority: 0.8,
  sitemapChangeFreq: "daily",
};

export const GET = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";

  // Check Setting for dynamic page profile
  const settingKey = `seo.page.${encodeURIComponent(path)}`;
  const pageSetting = await prisma.setting.findUnique({
    where: { key: settingKey },
  });

  if (pageSetting && pageSetting.value) {
    return ok(pageSetting.value);
  }

  // Fallback: check if path matches a known SeoMetadata entity
  const entityType = url.searchParams.get("entityType") as SeoEntityType | null;
  const entityId = url.searchParams.get("entityId") || undefined;

  let existingMeta = null;
  if (entityType) {
    existingMeta = await prisma.seoMetadata.findFirst({
      where: { entityType, entityId: entityId || null },
    });
  }

  const result: DynamicPageSeoPayload = {
    ...DEFAULT_SEO_CONFIG,
    path,
    metaTitle: existingMeta?.metaTitle || `${path} | SRM Car Rentals`,
    metaDescription: existingMeta?.metaDescription || DEFAULT_SEO_CONFIG.metaDescription,
    metaKeywords: existingMeta?.metaKeywords || DEFAULT_SEO_CONFIG.metaKeywords,
    canonicalUrl: existingMeta?.canonicalUrl || `https://srmcarrentals.in${path === "/" ? "" : path}`,
    robotsMeta: existingMeta?.robotsMeta || "INDEX_FOLLOW",
    ogTitle: existingMeta?.ogTitle || existingMeta?.metaTitle || "SRM Car Rentals",
    ogDescription: existingMeta?.ogDescription || existingMeta?.metaDescription || DEFAULT_SEO_CONFIG.ogDescription,
    ogImage: existingMeta?.ogImage || DEFAULT_SEO_CONFIG.ogImage,
    twitterCard: existingMeta?.twitterCard || "summary_large_image",
  };

  return ok(result);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const body: DynamicPageSeoPayload = await req.json();

  const path = body.path || "/";
  const settingKey = `seo.page.${encodeURIComponent(path)}`;

  // 1. Persist full rich profile in Setting store
  await prisma.setting.upsert({
    where: { key: settingKey },
    create: {
      key: settingKey,
      group: "seo.page",
      value: body as any,
    },
    update: {
      value: body as any,
    },
  });

  // 2. If entityType is provided, also sync with SeoMetadata for backward compatibility
  if (body.entityType && body.entityType !== "CUSTOM") {
    const entityType = body.entityType as SeoEntityType;
    const entityId = body.entityId || null;

    const seoData: any = {
      entityType,
      entityId,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      metaKeywords: body.metaKeywords,
      canonicalUrl: body.canonicalUrl,
      robotsMeta: (body.robotsMeta as any) || "INDEX_FOLLOW",
      ogTitle: body.ogTitle,
      ogDescription: body.ogDescription,
      ogImage: body.ogImage,
      twitterCard: body.twitterCard,
    };

    if (entityType === "CAR" && entityId) seoData.carId = entityId;
    if (entityType === "CAR_CATEGORY" && entityId) seoData.carCategoryId = entityId;
    if (entityType === "LOCATION" && entityId) seoData.locationId = entityId;
    if (entityType === "AIRPORT" && entityId) seoData.airportId = entityId;
    if (entityType === "BLOG_POST" && entityId) seoData.blogId = entityId;
    if (entityType === "PAGE" && entityId) seoData.pageId = entityId;

    const existing = await prisma.seoMetadata.findFirst({
      where: { entityType, entityId },
    });

    if (existing) {
      await prisma.seoMetadata.update({
        where: { id: existing.id },
        data: seoData,
      });
    } else {
      await prisma.seoMetadata.create({
        data: seoData,
      });
    }
  }

  return ok({ success: true, path, data: body });
});
