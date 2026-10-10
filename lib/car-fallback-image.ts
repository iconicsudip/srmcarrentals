/** Stock photo used when a car has no uploaded image (or its image fails to load). */
const BRAND_FALLBACK_IMAGES: Record<string, string> = {
  "maruti suzuki":
    "https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?w=800&q=80&auto=format&fit=crop",
  maruti:
    "https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?w=800&q=80&auto=format&fit=crop",
  hyundai:
    "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&q=80&auto=format&fit=crop",
  toyota:
    "https://srm-rentals-uploads.s3.ap-south-1.amazonaws.com/cars/toyota-rumion-Toyota-Rumion-SRM-Car-Rentals-1.png",
  kia:
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80&auto=format&fit=crop",
  mahindra:
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80&auto=format&fit=crop",
  tata:
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80&auto=format&fit=crop",
  honda:
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&auto=format&fit=crop",
  renault:
    "https://images.unsplash.com/photo-1581650107963-3b032af8a517?w=800&q=80&auto=format&fit=crop",
  ford:
    "https://images.unsplash.com/photo-1551830820-c6b3bdc0cfcb?w=800&q=80&auto=format&fit=crop",
  volkswagen:
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80&auto=format&fit=crop",
  skoda:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
  default:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80&auto=format&fit=crop",
};

export function getCarFallbackImage(brandName: string, categoryName?: string | null): string {
  const brand = brandName.toLowerCase();
  for (const [k, url] of Object.entries(BRAND_FALLBACK_IMAGES)) {
    if (brand.includes(k)) return url;
  }
  if (categoryName) {
    const cat = categoryName.toLowerCase();
    for (const [k, url] of Object.entries(BRAND_FALLBACK_IMAGES)) {
      if (cat.includes(k)) return url;
    }
  }
  return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80&auto=format&fit=crop";
}

