import type { Metadata } from "next";
import { FaqSection } from "@/components/website/faq-section";
import { getCompanyContent, getFaqPageContent } from "@/modules/website/public-content.service";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Frequently Asked Questions | SRM Car Rentals",
    description: "Get answers to common questions about renting a self-drive car with SRM Car Rentals in Udaipur, Jaipur, and Navsari.",
    alternates: { canonical: "/faq" },
  };
  const resolved = await getDynamicSeoForPath("/faq", fallback);
  return resolved.metadata;
}

export default async function FaqPage() {
  const [faqContent, company] = await Promise.all([getFaqPageContent(), getCompanyContent()]);

  return (
    <div className="min-h-screen bg-neutral-950 py-12">
      <DynamicJsonLd path="/faq" />
      <FaqSection data={faqContent} phone={company.phone} />
    </div>
  );
}
