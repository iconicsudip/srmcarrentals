import type { Metadata } from "next";
import { richTextToPlain } from "@/lib/rich-text";
import { prisma } from "@/lib/prisma";
import { getCompanyForSchema } from "@/lib/seo/schema";

export interface ResolvedSeo {
  metadata: Metadata;
  jsonLd: Record<string, any> | null;
  aeoData?: {
    aiDirectAnswer?: string;
    entityDefinition?: string;
    faqPairs?: { question: string; answer: string }[];
    keyTakeaways?: string[];
  };
}

const VALID_OG_TYPES = new Set<string>([
  "website",
  "article",
  "book",
  "profile",
  "music.song",
  "music.album",
  "music.playlist",
  "music.radio_station",
  "video.movie",
  "video.episode",
  "video.tv_show",
  "video.other",
]);

export function sanitizeOgType(type?: string): "website" | "article" | "book" | "profile" {
  if (type && VALID_OG_TYPES.has(type)) {
    return type as any;
  }
  return "website";
}

export async function getDynamicSeoForPath(path: string, fallback?: Metadata): Promise<ResolvedSeo> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://srmcarrentals.com";
  const canonicalUrl = `${appUrl}${path === "/" ? "" : path}`;

  try {
    const settingKey = `seo.page.${encodeURIComponent(path)}`;
    const setting = await prisma.setting.findUnique({
      where: { key: settingKey },
    });

    if (setting && setting.value) {
      const cfg = setting.value as any;

      const robotsDirective = cfg.robotsMeta || "INDEX_FOLLOW";
      const isNoIndex = robotsDirective.includes("NOINDEX");
      const isNoFollow = robotsDirective.includes("NOFOLLOW");

      const metadata: Metadata = {
        title: cfg.metaTitle || fallback?.title || "SRM Car Rentals",
        description: cfg.metaDescription || fallback?.description || undefined,
        keywords: cfg.metaKeywords ? cfg.metaKeywords.split(",").map((k: string) => k.trim()) : undefined,
        alternates: {
          canonical: cfg.canonicalUrl || canonicalUrl,
        },
        robots: {
          index: !isNoIndex,
          follow: !isNoFollow,
        },
        openGraph: {
          title: cfg.ogTitle || cfg.metaTitle || fallback?.title || "SRM Car Rentals",
          description: cfg.ogDescription || cfg.metaDescription || fallback?.description || undefined,
          url: cfg.canonicalUrl || canonicalUrl,
          images: cfg.ogImage ? [{ url: cfg.ogImage }] : undefined,
          type: sanitizeOgType(cfg.ogType),
        },
        twitter: {
          card: (cfg.twitterCard as any) || "summary_large_image",
          title: cfg.ogTitle || cfg.metaTitle,
          description: cfg.ogDescription || cfg.metaDescription,
          images: cfg.ogImage ? [cfg.ogImage] : undefined,
        },
      };

      // Generate Schema.org JSON-LD
      let jsonLd: Record<string, any> | null = null;
      if (cfg.enableStructuredData) {
        // "Custom" with no usable JSON falls back to a sensible default for the page instead of emitting nothing
        let customOk = false;
        if (cfg.schemaType === "Custom" && cfg.customSchemaJson) {
          try {
            jsonLd = JSON.parse(cfg.customSchemaJson);
            customOk = true;
          } catch {
            // invalid json fallback
          }
        }
        const effectiveType: string =
          cfg.schemaType === "Custom" ? (path === "/" ? "LocalBusiness" : "Organization") : cfg.schemaType === "BlogPosting" ? "Article" : cfg.schemaType;
        if (customOk) {
          // keep the admin's own JSON-LD exactly as written
        } else if (effectiveType === "Product") {
          // the car page writes its own, complete Product markup (price, availability…) — adding a second one would conflict
          jsonLd = null;
        } else if (effectiveType === "CollectionPage") {
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: cfg.metaTitle,
            description: cfg.metaDescription,
            url: cfg.canonicalUrl || canonicalUrl,
          };
        } else if (effectiveType === "FAQPage" && Array.isArray(cfg.faqPairs) && cfg.faqPairs.length > 0) {
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: cfg.faqPairs.map((p: any) => ({
              "@type": "Question",
              name: p.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: richTextToPlain(String(p.answer ?? "")),
              },
            })),
          };
        } else if (effectiveType === "AutoRental" || effectiveType === "LocalBusiness") {
          // Business details come from Admin → Homepage → Company, so nothing here is a made-up placeholder
          const biz = await getCompanyForSchema(appUrl);
          jsonLd = {
            "@context": "https://schema.org",
            "@type": effectiveType === "AutoRental" ? "AutoRental" : "AutomotiveBusiness",
            name: biz.name,
            description: cfg.metaDescription || biz.description,
            url: cfg.canonicalUrl || canonicalUrl,
            image: cfg.ogImage || biz.logo,
            logo: biz.logo,
            telephone: biz.telephone,
            email: biz.email,
            address: biz.address,
            priceRange: "₹₹",
            areaServed: ["Udaipur", "Jaipur", "Navsari"],
            sameAs: biz.sameAs,
          };
        } else if (effectiveType === "Article") {
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: cfg.metaTitle,
            description: cfg.metaDescription,
            image: cfg.ogImage,
            publisher: {
              "@type": "Organization",
              name: "SRM Car Rentals",
              logo: {
                "@type": "ImageObject",
                url: `${appUrl}/logo.png`,
              },
            },
          };
        } else {
          // Organization fallback
          const biz = await getCompanyForSchema(appUrl);
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: biz.name,
            url: appUrl,
            logo: biz.logo,
            description: cfg.metaDescription || biz.description,
            telephone: biz.telephone,
            email: biz.email,
            address: biz.address,
            sameAs: biz.sameAs,
          };
        }
      }

      return {
        metadata,
        jsonLd,
        aeoData: cfg.aeoEnabled
          ? {
              aiDirectAnswer: cfg.aiDirectAnswer,
              entityDefinition: cfg.entityDefinition,
              faqPairs: cfg.faqPairs,
              keyTakeaways: cfg.keyTakeaways,
            }
          : undefined,
      };
    }
  } catch {
    // fallback
  }

  return {
    metadata: fallback || {
      title: "SRM Car Rentals | Luxury & Self-Drive India",
      description: "Rent premium luxury sedans and self-drive cars in India.",
      alternates: { canonical: canonicalUrl },
    },
    jsonLd: null,
  };
}

/**
 * Server component that renders the Schema.org JSON-LD and AEO meta snippets
 */
export async function DynamicJsonLd({ path }: { path: string }) {
  const seo = await getDynamicSeoForPath(path);
  if (!seo.jsonLd && !seo.aeoData) return null;

  return (
    <>
      {seo.jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
        />
      )}
      {seo.aeoData?.aiDirectAnswer && (
        <meta name="ai-answer-snippet" content={seo.aeoData.aiDirectAnswer} />
      )}
      {seo.aeoData?.entityDefinition && (
        <meta name="ai-entity-definition" content={seo.aeoData.entityDefinition} />
      )}
    </>
  );
}
