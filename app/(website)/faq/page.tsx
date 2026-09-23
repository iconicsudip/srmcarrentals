import type { Metadata } from "next";
import { FaqSection } from "@/components/website/faq-section";
import { getFaqPageContent } from "@/modules/website/public-content.service";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | SRM Car Rentals",
  description: "Get answers to common questions about renting a self-drive car with SRM Car Rentals in Udaipur, Jaipur, and Navsari. Security deposits, fuel policy, documents, and cancellation.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const faqContent = await getFaqPageContent();

  return (
    <div className="min-h-screen bg-neutral-950 py-12">
      <FaqSection data={faqContent} />
    </div>
  );
}
