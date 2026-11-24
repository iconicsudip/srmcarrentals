import { Suspense } from "react";
import { postalAddressFrom } from "@/lib/seo/schema";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { B2bSection } from "@/components/website/b2b-section";
import { BrandFleetSection } from "@/components/website/brand-fleet-section";
import { CategoryCircles } from "@/components/website/category-circles";
import { PriceSortedCars } from "@/components/website/price-sorted-cars";
import { CategoryCardsSection } from "@/components/website/category-cards-section";
import { ChauffeurSection } from "@/components/website/chauffeur-section";
import { FleetSection } from "@/components/website/fleet-section";
import { GallerySection } from "@/components/website/gallery-section";
import { HeroSection, TrustBadgeRow } from "@/components/website/hero-section";
import { PhilosophySection } from "@/components/website/philosophy-section";
import { TestimonialsSection } from "@/components/website/testimonials-section";
import { ToursSection } from "@/components/website/tours-section";
import { WhyChooseUsSection } from "@/components/website/why-choose-us-section";
import { FaqSection } from "@/components/website/faq-section";
import {
  getCompanyContent,
  getFaqPageContent,
  getFleetCounts,
  getHomepageContent,
  getHomepageTestimonialsSummary,
  getSiteText,
  getAvailableServices,
  listActiveBrandsWithCarCounts,
  listActiveCars,
  listActiveCategories,
  listCategoriesWithCounts,
  listPublicCars,
  listActiveChauffeurServices,
  listActiveGalleryImages,
  listActiveLocations,
  listActiveTours,
} from "@/modules/website/public-content.service";

// Below-the-fold, client-heavy: split out of the initial JS bundle.
const VideoShowcaseSection = dynamic(() =>
  import("@/components/website/video-showcase-section").then((m) => m.VideoShowcaseSection),
);

import { after } from "next/server";
import { maybeRunWeeklyGoogleReviewsSync } from "@/lib/google-reviews/sync";
import { getInstagramFeed } from "@/lib/instagram/feed";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanyContent();
  const fallback: Metadata = {
    title: `${company.name} — Self Drive & Chauffeur Car Rentals`,
    description: company.description || undefined,
    alternates: { canonical: "/" },
    openGraph: { title: company.name, description: company.description || undefined, type: "website" },
  };
  const resolved = await getDynamicSeoForPath("/", fallback);
  return resolved.metadata;
}

/** Strip fields not rendered on homepage cards to keep the SSR RSC payload and client hydration lean. */
function trimCarForHomepage<T extends {
  images?: { url: string; altText?: string | null }[];
  features?: { feature: { id: string; name: string; icon?: string | null } }[];
  safetyFeatures?: unknown;
  kmPlans?: { plan: number; km: number; dailyPrice: number; hourlyPrice: number | null; isPopular?: boolean }[];
  kmPlansByLocation?: unknown;
  locations?: { locationId: string; location: { id: string; name: string; slug?: string; city?: string | null } }[];
}>(car: T, opts: { keepLocations?: boolean; maxFeatures?: number } = {}): T {
  const { safetyFeatures: _sf, kmPlansByLocation: _kml, ...rest } = car;
  return {
    ...rest,
    images: car.images?.slice(0, 1) ?? [],
    features: car.features?.slice(0, opts.maxFeatures ?? 1) ?? [],
    kmPlans: car.kmPlans?.slice(0, 1),
    locations: opts.keepLocations ? car.locations : undefined,
  } as T;
}

async function BelowFoldHome({
  content,
  company,
  counts,
  services,
  siteText,
}: {
  content: Awaited<ReturnType<typeof getHomepageContent>>;
  company: Awaited<ReturnType<typeof getCompanyContent>>;
  counts: Awaited<ReturnType<typeof getFleetCounts>>;
  services: Awaited<ReturnType<typeof getAvailableServices>>;
  siteText: Awaited<ReturnType<typeof getSiteText>>;
}) {
  const [faqContent, rawCars, categories, brands, chauffeurServices, tours, testimonialSummary, gallery, circleCategories, sortedCars, instagramPosts] =
    await Promise.all([
      getFaqPageContent(),
      listActiveCars(20),
      listActiveCategories(),
      listActiveBrandsWithCarCounts(),
      listActiveChauffeurServices(),
      listActiveTours(6),
      getHomepageTestimonialsSummary(16),
      listActiveGalleryImages(8),
      listCategoriesWithCounts(),
      listPublicCars({ sort: "price-asc", pageSize: 24 }),
      getInstagramFeed(),
    ]);

  const fleetCars = rawCars.map((c) => trimCarForHomepage(c, { keepLocations: true, maxFeatures: 4 }));
  const brandCars = rawCars.map((c) => trimCarForHomepage(c, { keepLocations: false, maxFeatures: 1 }));
  const priceSorted = sortedCars.cars.map((c) => trimCarForHomepage(c, { keepLocations: false, maxFeatures: 1 }));

  return (
    <>
      {services.cars && (
        <>
          <CategoryCircles categories={circleCategories} />
          <PriceSortedCars cars={priceSorted} total={sortedCars.total} text={siteText.sections.priceSorted} />
        </>
      )}
      <div className="defer-render"><CategoryCardsSection counts={counts} services={services} cards={siteText.categoryCards} heading={siteText.sections.categories} /></div>
      <div className="defer-render">{services.cars && <FleetSection cars={fleetCars} categories={categories} totalCount={counts.carCount} heading={siteText.sections.fleet} text={siteText.fleet} />}</div>
      <div className="defer-render">{services.taxi && <ChauffeurSection services={chauffeurServices} phone={company.phone} heading={siteText.sections.chauffeur} />}</div>
      <div className="defer-render">{services.cars && <BrandFleetSection cars={brandCars} brands={brands} totalCount={counts.carCount} heading={siteText.sections.brands} />}</div>
      <div className="defer-render">{services.tours && <ToursSection tours={tours} heading={siteText.sections.tours} />}</div>
      <div className="defer-render"><PhilosophySection content={content.philosophy} text={siteText.philosophy} /></div>
      <div className="defer-render"><VideoShowcaseSection content={content.videoShowcase} /></div>
      <div className="defer-render"><WhyChooseUsSection content={content.whyChooseUs} /></div>
      <div className="defer-render"><FaqSection data={faqContent} phone={company.phone} /></div>
      <div className="defer-render"><TestimonialsSection testimonials={testimonialSummary.items} stats={testimonialSummary.stats} heading={siteText.sections.testimonials} /></div>
      <div className="defer-render"><GallerySection images={gallery} company={company} instagramPosts={instagramPosts} /></div>
      <div className="defer-render"><B2bSection content={content.b2b} phone={company.phone} /></div>
    </>
  );
}

export default async function HomePage() {
  // Weekly Saturday refresh of Google reviews (runs after the response; a no-op the rest of the week)
  after(() => maybeRunWeeklyGoogleReviewsSync());
  // Only await above-the-fold data before flushing the hero (most of these are already deduplicated with WebsiteLayout).
  const [content, company, locations, counts, services, siteText] = await Promise.all([
    getHomepageContent(),
    getCompanyContent(),
    listActiveLocations(),
    getFleetCounts(),
    getAvailableServices(),
    getSiteText(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    telephone: company.phone || undefined,
    email: company.email || undefined,
    address: company.address ? postalAddressFrom(company.address) : undefined,
    logo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://srmcarrentals.com"}/images/srm-logo.webp`,
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://srmcarrentals.com",
  };

  return (
    <>
      <DynamicJsonLd path="/" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <HeroSection content={content.hero} locations={locations} services={services} carCount={counts.carCount} cityCount={new Set((locations as { city?: string }[]).map((l) => l.city?.trim().toLowerCase()).filter(Boolean)).size} text={siteText.hero} widgetText={siteText.bookingWidget} phone={company.phone} />
      <TrustBadgeRow badges={content.trustBadges} />
      <Suspense fallback={<div className="min-h-screen" />}>
        <BelowFoldHome content={content} company={company} counts={counts} services={services} siteText={siteText} />
      </Suspense>
    </>
  );
}
