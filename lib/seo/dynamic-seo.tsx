import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

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

export async function getDynamicSeoForPath(path: string, fallback?: Metadata): Promise<ResolvedSeo> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://srmcarrentals.in";
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
          type: (cfg.ogType as any) || "website",
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
        if (cfg.schemaType === "Custom" && cfg.customSchemaJson) {
          try {
            jsonLd = JSON.parse(cfg.customSchemaJson);
          } catch {
            // invalid json fallback
          }
        } else if (cfg.schemaType === "FAQPage" && Array.isArray(cfg.faqPairs) && cfg.faqPairs.length > 0) {
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: cfg.faqPairs.map((p: any) => ({
              "@type": "Question",
              name: p.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: p.answer,
              },
            })),
          };
        } else if (cfg.schemaType === "AutoRental") {
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "AutoRental",
            name: cfg.metaTitle || "SRM Car Rentals",
            description: cfg.metaDescription,
            url: cfg.canonicalUrl || canonicalUrl,
            image: cfg.ogImage,
            priceRange: "₹₹",
            telephone: "+91-9876543210",
          };
        } else if (cfg.schemaType === "LocalBusiness") {
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "AutomotiveBusiness",
            name: cfg.metaTitle || "SRM Car Rentals",
            description: cfg.metaDescription,
            url: cfg.canonicalUrl || canonicalUrl,
            telephone: "+91-9876543210",
            address: {
              "@type": "PostalAddress",
              addressCountry: "IN",
            },
          };
        } else if (cfg.schemaType === "Article") {
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
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "SRM Car Rentals",
            url: appUrl,
            description: cfg.metaDescription,
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
