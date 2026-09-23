import type { Metadata } from "next";

import { B2bSection } from "@/components/website/b2b-section";
import { BrandFleetSection } from "@/components/website/brand-fleet-section";
import { CategoryCardsSection } from "@/components/website/category-cards-section";
import { ChauffeurSection } from "@/components/website/chauffeur-section";
import { FleetSection } from "@/components/website/fleet-section";
import { GallerySection } from "@/components/website/gallery-section";
import { HeroSection, TrustBadgeRow } from "@/components/website/hero-section";
import { PhilosophySection } from "@/components/website/philosophy-section";
import { TestimonialsSection } from "@/components/website/testimonials-section";
import { ToursSection } from "@/components/website/tours-section";
import { VideoShowcaseSection } from "@/components/website/video-showcase-section";
import { WhyChooseUsSection } from "@/components/website/why-choose-us-section";
import { FaqSection } from "@/components/website/faq-section";
import {
  getCompanyContent,
  getFaqPageContent,
  getFleetCounts,
  getHomepageContent,
  listActiveBrandsWithCarCounts,
  listActiveCars,
  listActiveCategories,
  listActiveChauffeurServices,
  listActiveGalleryImages,
  listActiveLocations,
  listActiveTestimonials,
  listActiveTours,
} from "@/modules/website/public-content.service";

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
  const [content, company, faqContent, cars, categories, brands, chauffeurServices, tours, testimonials, gallery, locations, counts] =
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

      <HeroSection content={content.hero} locations={locations} />
      <TrustBadgeRow badges={content.trustBadges} />
      <CategoryCardsSection counts={counts} />
      <FleetSection cars={cars} categories={categories} totalCount={counts.carCount} />
      <ChauffeurSection services={chauffeurServices} />
      <BrandFleetSection cars={cars} brands={brands} totalCount={counts.carCount} />
      <ToursSection tours={tours} />
      <PhilosophySection content={content.philosophy} />
      <VideoShowcaseSection content={content.videoShowcase} />
      <WhyChooseUsSection content={content.whyChooseUs} />
      <FaqSection data={faqContent} />
      <TestimonialsSection testimonials={testimonials} />
      <GallerySection images={gallery} company={company} />
      <B2bSection content={content.b2b} phone={company.phone} />
    </>
  );
}
