import type { Metadata } from "next";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Reservation Cart | SRM Car Rentals",
    description: "Review and manage your selected vehicles, rental dates, insurance coverage, and add-on services.",
    alternates: { canonical: "/cart" },
    robots: { index: false, follow: true },
  };
  const resolved = await getDynamicSeoForPath("/cart", fallback);
  return resolved.metadata;
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DynamicJsonLd path="/cart" />
      {children}
    </>
  );
}
