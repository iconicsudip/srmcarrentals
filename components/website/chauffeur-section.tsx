import Image from "next/image";
import { Briefcase, CheckCircle2, Star, Users } from "lucide-react";

import { SectionHeading } from "@/components/website/section-heading";
import { ChauffeurBookButton } from "@/components/website/chauffeur-book-dialog";

// High-quality Unsplash fallbacks keyed by category (case-insensitive)
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  sedan:
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1000&q=85&auto=format&fit=crop",
  suv:
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1000&q=85&auto=format&fit=crop",
  premium:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&q=85&auto=format&fit=crop",
  luxury:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&q=85&auto=format&fit=crop",
  airport:
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1000&q=85&auto=format&fit=crop",
  outstation:
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000&q=85&auto=format&fit=crop",
  default:
    "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=1000&q=85&auto=format&fit=crop",
};

function getCategoryFallbackImage(category: string): string {
  const key = category.toLowerCase().trim();
  for (const [k, url] of Object.entries(CATEGORY_FALLBACK_IMAGES)) {
    if (key.includes(k)) return url;
  }
  return CATEGORY_FALLBACK_IMAGES.default!;
}

export interface ChauffeurServiceData {
  id: string;
  name: string;
  slug: string;
  category: string;
  imageUrl: string | null;
  idealFor: string | null;
  capacityLabel: string | null;
  features: string[];
  pricePerKm: string | number | null;
  startingPrice: string | number;
  pricingUnit: "PER_TRIP" | "PER_KM";
  badge: string | null;
}

export function ChauffeurSection({
  services,
  phone = "+91 9414551250",
  hideHeading = false,
  className = "",
  columnsClassName = "grid-cols-1 md:grid-cols-2",
}: {
  services: ChauffeurServiceData[];
  phone?: string;
  hideHeading?: boolean;
  className?: string;
  columnsClassName?: string;
}) {
  if (services.length === 0) return null;

  const sectionContent = (
    <>
      {!hideHeading && (
        <SectionHeading
          badge="CHAUFFEUR FLEET & TRANSFERS"
          title="ARRIVE IN COMFORT."
          subtitle="Professional chauffeurs, sparkling clean interiors, and fixed transparent tariffs."
        />
      )}

      <div className={`grid gap-7 ${columnsClassName} ${!hideHeading ? "mt-12" : ""}`}>
        {services.map((service) => {
          const capacity = service.capacityLabel ?? "Up to 4 Passengers · 2 Bags";
          const categoryBadge = service.badge ?? service.category;

          return (
            <div
              key={service.id}
              className="group relative flex min-h-[540px] flex-col justify-between overflow-hidden rounded-3xl border border-neutral-200/90 bg-neutral-900 shadow-[0_10px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:border-orange-500/60 hover:shadow-[0_20px_50px_rgba(249,115,22,0.22)] hover:-translate-y-1.5"
            >
              {/* ── Full-cover image ── */}
              <Image
                src={service.imageUrl ?? getCategoryFallbackImage(service.category)}
                alt={service.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Readability gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10 pointer-events-none" />

              {/* Top badges */}
              <div className="relative z-10 flex items-center justify-between p-5">
                <span className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-orange-500/30 border border-white/20">
                  {categoryBadge}
                </span>
                <span className="rounded-xl bg-black/55 backdrop-blur-md px-2.5 py-1.5 text-[10px] font-bold text-neutral-100 border border-white/15 flex items-center gap-1 shadow-md">
                  <Star className="size-3 text-amber-400 fill-amber-400" />
                  <span>Verified Chauffeur</span>
                </span>
              </div>

              {/* Content over image */}
              <div className="relative z-10 flex flex-col gap-4 p-6 sm:p-7 text-white">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight group-hover:text-orange-400 transition-colors">
                    {service.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-xs font-medium text-white/70">
                    <span className="size-1.5 rounded-full bg-orange-500" />
                    <span>Executive Fleet · {service.category} Class</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 px-3 py-1.5 font-semibold">
                    <Users className="size-3.5 text-orange-400" />
                    {capacity}
                  </span>
                  {service.pricePerKm && (
                    <span className="rounded-xl bg-orange-500/25 border border-orange-400/40 px-2.5 py-1.5 font-extrabold text-orange-300">
                      ₹{Number(service.pricePerKm)}/km base
                    </span>
                  )}
                </div>

                {service.idealFor && (
                  <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-3.5 text-xs leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      <Briefcase className="size-3.5 text-orange-400" />
                      <span>Best Suited For</span>
                    </div>
                    <p className="text-white/80 pl-5">{service.idealFor}</p>
                  </div>
                )}

                {service.features.length > 0 && (
                  <ul className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
                    {service.features.slice(0, 4).map((feat) => (
                      <li key={feat} className="flex items-center gap-2 font-medium text-white/90">
                        <CheckCircle2 className="size-4 shrink-0 text-orange-400" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Price & booking */}
                <div className="flex flex-col gap-4 border-t border-white/15 pt-5 mt-1">
                  <div>
                    <div className="text-[10px] font-extrabold tracking-widest text-white/60 uppercase">
                      Fixed Tariff From
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl font-black tracking-tight">
                        ₹{Number(service.startingPrice).toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-semibold text-white/70">
                        / {service.pricingUnit === "PER_KM" ? "km" : "trip"}
                      </span>
                    </div>
                  </div>

                  <ChauffeurBookButton
                    phone={phone}
                    service={{
                      id: service.id,
                      name: service.name,
                      category: service.category,
                      capacity,
                      startingPrice: Number(service.startingPrice),
                      pricingUnit: service.pricingUnit,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (hideHeading) {
    return <div className={className}>{sectionContent}</div>;
  }

  return (
    <section id="chauffeur" className={`mx-auto max-w-[1520px] px-4 py-20 sm:px-6 lg:px-8 ${className}`}>
      {sectionContent}
    </section>
  );
}
