import type { Metadata } from "next";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Secure Checkout | SRM Car Rentals",
    description: "Complete your vehicle reservation with Aadhaar & driving license verification and 256-bit encrypted payment.",
    alternates: { canonical: "/checkout" },
    robots: { index: false, follow: true },
  };
  const resolved = await getDynamicSeoForPath("/checkout", fallback);
  return resolved.metadata;
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DynamicJsonLd path="/checkout" />
      {children}
    </>
  );
}
