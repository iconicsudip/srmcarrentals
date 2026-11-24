import { getSetting } from "@/modules/settings/settings.service";

interface CompanyLike {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  socialLinks?: Record<string, string | undefined>;
}

const CITY_REGION: Record<string, string> = { udaipur: "Rajasthan", jaipur: "Rajasthan", navsari: "Gujarat", surat: "Gujarat" };

/** A complete schema.org PostalAddress from the one-line company address (Google rejects an address that is only a country). */
export function postalAddressFrom(address?: string) {
  const text = (address ?? "").trim();
  const city = Object.keys(CITY_REGION).find((c) => text.toLowerCase().includes(c)) ?? "udaipur";
  return {
    "@type": "PostalAddress",
    streetAddress: text || undefined,
    addressLocality: city.charAt(0).toUpperCase() + city.slice(1),
    addressRegion: CITY_REGION[city],
    addressCountry: "IN",
  };
}

/** The business details saved in Admin → Homepage → Company, used for the website's business schema. */
export async function getCompanyForSchema(appUrl: string) {
  const c = (await getSetting<CompanyLike>("homepage.company")) ?? {};
  const sameAs = Object.values(c.socialLinks ?? {}).filter((v): v is string => typeof v === "string" && /^https?:\/\//i.test(v));
  return {
    name: c.name || "SRM Car Rentals",
    telephone: c.phone || undefined,
    email: c.email || undefined,
    address: postalAddressFrom(c.address),
    logo: `${appUrl}/images/srm-logo.webp`,
    sameAs: sameAs.length ? sameAs : undefined,
    description: c.description || undefined,
  };
}

/**
 * A car as a rentable Product. (A schema.org "Car" listing makes Google ask for a VIN, condition and stock — fields that only
 * make sense for vehicles being sold.)
 */
export function carRentalProduct(input: {
  url: string;
  name: string;
  brand?: string;
  model?: string;
  year?: number | string | null;
  description?: string | null;
  images: string[];
  pricePerDay?: number | null;
  sku: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${input.name} self-drive car rental`,
    description: input.description || `Rent the ${input.name} on self-drive with transparent daily pricing and doorstep delivery.`,
    sku: input.sku,
    category: "Car rental",
    brand: input.brand ? { "@type": "Brand", name: input.brand } : undefined,
    model: input.model || undefined,
    releaseDate: input.year ? String(input.year) : undefined,
    image: input.images.length ? input.images : undefined,
    url: input.url,
    offers:
      input.pricePerDay && input.pricePerDay > 0
        ? {
            "@type": "Offer",
            url: input.url,
            price: input.pricePerDay,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            priceSpecification: { "@type": "UnitPriceSpecification", price: input.pricePerDay, priceCurrency: "INR", unitText: "per day" },
          }
        : undefined,
  };
}
