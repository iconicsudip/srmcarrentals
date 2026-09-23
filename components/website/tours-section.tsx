import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, ShieldCheck, Star } from "lucide-react";

import { SectionHeading } from "@/components/website/section-heading";

export interface TourData {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  rating: string | number;
  durationDays: number;
  durationNights: number;
  description: string | null;
  keyExperiences: string[];
  startingPrice: string | number;
  category: { name: string };
  assignedCar?: { name: string } | null;
}

// Rajasthan-themed Unsplash fallbacks by category keyword
const TOUR_FALLBACK_IMAGES: Record<string, string> = {
  heritage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80&auto=format&fit=crop",
  desert: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80&auto=format&fit=crop",
  wildlife: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80&auto=format&fit=crop",
  adventure: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80&auto=format&fit=crop",
  palace: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80&auto=format&fit=crop",
  rajasthan: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&q=80&auto=format&fit=crop",
};

function getTourFallback(categoryName: string): string {
  const key = categoryName.toLowerCase();
  for (const [k, url] of Object.entries(TOUR_FALLBACK_IMAGES)) {
    if (key.includes(k)) return url;
  }
  return TOUR_FALLBACK_IMAGES.default!;
}

export function ToursSection({ tours }: { tours: TourData[] }) {
  if (tours.length === 0) return null;

  return (
    <section id="tours" className="relative overflow-hidden border-t border-white/5 bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          badge="CURATED EXPEDITIONS"
          title="GO BEYOND THE DRIVE."
          subtitle="Handcrafted tours through forts, deserts, and marble palaces, with premium machines and local insider knowledge."
        />

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {tours.map((tour) => {
            const imgSrc = tour.imageUrl ?? getTourFallback(tour.category.name);
            return (
              <div
                key={tour.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 transition hover:border-orange-500/30 sm:flex-row"
              >
                {/* Image column */}
                <div className="relative h-56 shrink-0 overflow-hidden bg-neutral-800 sm:h-auto sm:w-64">
                  <Image
                    src={imgSrc}
                    alt={tour.name}
                    fill
                    sizes="300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Category badge */}
                  <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                    <MapPin className="size-3 text-orange-400" /> {tour.category.name}
                  </span>
                  {/* Rating badge */}
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                    <Star className="size-3 fill-amber-400 text-amber-400" /> {Number(tour.rating).toFixed(1)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <span className="flex items-center gap-1.5 text-xs text-white/40">
                    <Clock className="size-3.5" /> {tour.durationDays} Days · {tour.durationNights} Nights
                  </span>
                  <h3 className="text-xl font-bold text-white">{tour.name}</h3>
                  {tour.description && (
                    <p className="text-sm italic text-white/50">&ldquo;{tour.description}&rdquo;</p>
                  )}

                  {tour.keyExperiences.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {tour.keyExperiences.slice(0, 4).map((exp) => (
                        <span key={exp} className="flex items-center gap-1.5 text-xs text-white/70">
                          <ShieldCheck className="size-3 shrink-0 text-orange-500" /> {exp}
                        </span>
                      ))}
                    </div>
                  )}

                  {tour.assignedCar && (
                    <p className="text-xs text-white/40">
                      Fleet Assigned: <span className="text-white/70">{tour.assignedCar.name}</span>
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Starting At</span>
                      <div className="text-xl font-black text-white">
                        ₹{Number(tour.startingPrice).toLocaleString("en-IN")}
                        <span className="text-xs font-normal text-white/40"> / package</span>
                      </div>
                    </div>
                    <Link
                      href={`/tours/${tour.slug}`}
                      className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
                    >
                      Explore Tour <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
