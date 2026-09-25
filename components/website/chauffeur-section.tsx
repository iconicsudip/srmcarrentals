import Image from "next/image";
import Link from "next/link";
import { CheckCircle, UserCog, Users } from "lucide-react";

import { SectionHeading } from "@/components/website/section-heading";

// High-quality Unsplash fallbacks keyed by category (case-insensitive)
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  sedan:
    "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80&auto=format&fit=crop",
  suv:
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop",
  premium:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
  luxury:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop",
  airport:
    "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80&auto=format&fit=crop",
  outstation:
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop",
  default:
    "https://images.unsplash.com/photo-1631295868223-63265b40d9e4?w=800&q=80&auto=format&fit=crop",
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
}: {
  services: ChauffeurServiceData[];
  phone?: string;
}) {
  if (services.length === 0) return null;

  const whatsappNumber = phone.replace(/[^0-9]/g, "");

  return (
    <section id="chauffeur" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        badge="CHAUFFEUR FLEET & TRANSFERS"
        title="ARRIVE IN COMFORT."
        subtitle="Professional chauffeurs, sparkling clean interiors, and fixed transparent tariffs."
      />

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          // Parse capacity from label or use fallback
          const capacity = service.capacityLabel ?? "Up to 4 Passengers · 2 Bags";
          const categoryBadge = service.badge ?? service.category;

          return (
            <div
              key={service.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-neutral-900 transition-all duration-300 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5"
            >
              {/* ── Tall image block ── */}
              <div className="relative h-56 shrink-0 overflow-hidden bg-neutral-800">
                <Image
                  src={service.imageUrl ?? getCategoryFallbackImage(service.category)}
                  alt={service.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Category badge — top left, solid orange */}
                <span className="absolute top-3 left-3 rounded-md bg-orange-500 px-2.5 py-1 text-[10px] font-black tracking-widest text-white uppercase">
                  {categoryBadge}
                </span>

                {/* Capacity + km strip — bottom overlay */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pb-3 pt-8">
                  <span className="flex items-center gap-2 text-[11px] font-medium text-white/75">
                    <Users className="size-3.5 text-white/50" />
                    {capacity}
                  </span>
                  {service.pricePerKm && (
                    <span className="text-[11px] font-semibold text-white/60">
                      ₹{Number(service.pricePerKm)}/km base
                    </span>
                  )}
                </div>
              </div>

              {/* ── Card body ── */}
              <div className="flex flex-1 flex-col gap-4 p-5">

                {/* Name + subtitle */}
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-orange-500 leading-tight">
                    {service.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-white/35">{service.category}</p>
                </div>

                {/* Ideal For box */}
                {service.idealFor && (
                  <div className="rounded-xl bg-white/5 px-3.5 py-2.5 text-xs text-white/55 leading-relaxed">
                    <span className="font-semibold text-white/75">Ideal For:</span>{" "}
                    {service.idealFor}
                  </div>
                )}

                {/* Feature checklist */}
                {service.features.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {service.features.slice(0, 4).map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-xs text-white/60">
                        <CheckCircle className="size-4 shrink-0 text-orange-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Price + CTA */}
                <div className="flex items-end justify-between border-t border-white/8 pt-4">
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-white/35 uppercase">
                      Starting From
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-2xl font-black text-white">
                        ₹{Number(service.startingPrice).toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-white/35">
                        / {service.pricingUnit === "PER_KM" ? "km" : "trip"}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const whatsappMsg = encodeURIComponent(
                      `Hello SRM Car Rentals! 👋\n\nI want to book a Chauffeur Taxi:\n\n` +
                      `• *Service*: ${service.name}\n` +
                      `• *Category*: ${service.category}\n` +
                      `• *Capacity*: ${capacity}\n` +
                      `• *Starting Tariff*: ₹${Number(service.startingPrice).toLocaleString("en-IN")} / ${service.pricingUnit === "PER_KM" ? "km" : "trip"}\n\n` +
                      `Please share vehicle availability, driver handover, and booking details!`,
                    );
                    return (
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95"
                      >
                        BOOK TAXI →
                      </a>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
