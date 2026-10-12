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
  listActiveTestimonials,
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

export const revalidate = 60;

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

export default async function HomePage() {
  // Weekly Saturday refresh of Google reviews (runs after the response; a no-op the rest of the week)
  after(() => maybeRunWeeklyGoogleReviewsSync());
  const [content, company, faqContent, cars, categories, brands, chauffeurServices, tours, testimonials, gallery, locations, counts, services, siteText, circleCategories, sortedCars] =
    await Promise.all([
      getHomepageContent(),
      getCompanyContent(),
      getFaqPageContent(),
      listActiveCars(24),
      listActiveCategories(),
      listActiveBrandsWithCarCounts(),
      listActiveChauffeurServices(),
      listActiveTours(6),
      listActiveTestimonials(),
      listActiveGalleryImages(8),
      listActiveLocations(),
      getFleetCounts(),
      getAvailableServices(),
      getSiteText(),
      listCategoriesWithCounts(),
      listPublicCars({ sort: "price-asc", pageSize: 60 }),
    ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    telephone: company.phone || undefined,
    email: company.email || undefined,
    address: company.address || undefined,
    url: process.env.NEXT_PUBLIC_APP_URL,
  };

  return (
    <>
      <DynamicJsonLd path="/" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <HeroSection content={content.hero} locations={locations} services={services} carCount={counts.carCount} cityCount={new Set((locations as { city?: string }[]).map((l) => l.city?.trim().toLowerCase()).filter(Boolean)).size} text={siteText.hero} widgetText={siteText.bookingWidget} />
      <TrustBadgeRow badges={content.trustBadges} />
      {services.cars && (
        <>
          <CategoryCircles categories={circleCategories} />
          <PriceSortedCars cars={sortedCars.cars} total={sortedCars.total} text={siteText.sections.priceSorted} />
        </>
      )}
      <CategoryCardsSection counts={counts} services={services} cards={siteText.categoryCards} heading={siteText.sections.categories} />
      {services.cars && <FleetSection cars={cars} categories={categories} totalCount={counts.carCount} heading={siteText.sections.fleet} text={siteText.fleet} />}
      {services.taxi && <ChauffeurSection services={chauffeurServices} phone={company.phone} heading={siteText.sections.chauffeur} />}
      {services.cars && <BrandFleetSection cars={cars} brands={brands} totalCount={counts.carCount} heading={siteText.sections.brands} />}
      {services.tours && <ToursSection tours={tours} heading={siteText.sections.tours} />}
      <PhilosophySection content={content.philosophy} text={siteText.philosophy} />
      <VideoShowcaseSection content={content.videoShowcase} />
      <WhyChooseUsSection content={content.whyChooseUs} />
      <FaqSection data={faqContent} phone={company.phone} />
      <TestimonialsSection testimonials={testimonials} heading={siteText.sections.testimonials} />
      <GallerySection images={gallery} company={company} instagramPosts={await getInstagramFeed()} />
      <B2bSection content={content.b2b} phone={company.phone} />
    </>
  );
}
