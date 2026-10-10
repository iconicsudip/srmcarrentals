import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { SectionHeading } from "@/components/website/section-heading";

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
  columnsClassName = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}: {
  services: ChauffeurServiceData[];
  phone?: string;
  hideHeading?: boolean;
  className?: string;
  columnsClassName?: string;
}) {
  if (services.length === 0) return null;

  const whatsappNumber = phone.replace(/[^0-9]/g, "");

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
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-neutral-200/90 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-orange-500/50 hover:shadow-[0_20px_50px_rgba(249,115,22,0.14)] hover:-translate-y-1.5"
            >
              {/* ── Visual Media Block ── */}
              <div className="relative h-64 shrink-0 overflow-hidden bg-neutral-900">
                <Image
                  src={service.imageUrl ?? getCategoryFallbackImage(service.category)}
                  alt={service.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                />

                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
                  {/* Category Pill */}
                  <span className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-orange-500/30 border border-white/20">
                    {categoryBadge}
                  </span>

                  {/* Rating / Quality Badge */}
                  <span className="rounded-xl bg-black/60 backdrop-blur-md px-2.5 py-1.5 text-[10px] font-bold text-neutral-100 border border-white/15 flex items-center gap-1 shadow-md">
                    <Star className="size-3 text-amber-400 fill-amber-400" />
                    <span>Verified Chauffeur</span>
                  </span>
                </div>

                {/* Bottom Overlay Capacity & Rate Strip */}
                <div className="absolute inset-x-3.5 bottom-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 px-3.5 py-2 flex items-center justify-between text-white shadow-lg">
                  <span className="flex items-center gap-2 text-xs font-semibold text-white/95">
                    <Users className="size-3.5 text-orange-400" />
                    {capacity}
                  </span>
                  {service.pricePerKm && (
                    <span className="text-xs font-extrabold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-lg border border-orange-400/30">
                      ₹{Number(service.pricePerKm)}/km base
                    </span>
                  )}
                </div>
              </div>

              {/* ── Card Content Body ── */}
              <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
                {/* Title & Category Line */}
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-neutral-950 group-hover:text-orange-600 transition-colors leading-tight">
                    {service.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-xs font-medium text-neutral-500">
                    <span className="size-1.5 rounded-full bg-orange-500" />
                    <span>Executive Fleet · {service.category} Class</span>
                  </div>
                </div>

                {/* Ideal For Callout */}
                {service.idealFor && (
                  <div className="rounded-2xl border border-orange-100/90 bg-gradient-to-r from-orange-50/80 via-white to-amber-50/40 p-3.5 text-xs text-neutral-700 leading-relaxed shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900 mb-0.5">
                      <Briefcase className="size-3.5 text-orange-600" />
                      <span>Best Suited For</span>
                    </div>
                    <p className="text-neutral-600 pl-5">{service.idealFor}</p>
                  </div>
                )}

                {/* Feature Checklist */}
                {service.features.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Included Privileges
                    </div>
                    <ul className="grid grid-cols-1 gap-2 text-xs text-neutral-700">
                      {service.features.slice(0, 4).map((feat) => (
                        <li key={feat} className="flex items-center gap-2.5 font-medium">
                          <CheckCircle2 className="size-4 shrink-0 text-orange-500" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Price & Booking Footer */}
                <div className="flex items-end justify-between border-t border-neutral-150 pt-5 mt-2">
                  <div>
                    <div className="text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase">
                      Fixed Tariff From
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl font-black text-neutral-950 tracking-tight">
                        ₹{Number(service.startingPrice).toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-semibold text-neutral-500">
                        / {service.pricingUnit === "PER_KM" ? "km" : "trip"}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const whatsappMsg = encodeURIComponent(
                      `Hello SRM Car Rentals! 👋\n\nI want to book an Executive Chauffeur Taxi:\n\n` +
                      `• *Service*: ${service.name}\n` +
                      `• *Category*: ${service.category}\n` +
                      `• *Capacity*: ${capacity}\n` +
                      `• *Starting Tariff*: ₹${Number(service.startingPrice).toLocaleString("en-IN")} / ${service.pricingUnit === "PER_KM" ? "km" : "trip"}\n\n` +
                      `Please confirm chauffeur availability and pickup timing!`,
                    );
                    return (
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-orange-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
                      >
                        <MessageSquare className="size-4" />
                        <span>Book Taxi →</span>
                      </a>
                    );
                  })()}
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
