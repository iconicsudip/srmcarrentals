import type { Metadata } from "next";

import { BookingWidget } from "@/components/website/booking-widget";
import { ToursSection } from "@/components/website/tours-section";
import { listActiveTours, listActiveLocations, getAvailableServices } from "@/modules/website/public-content.service";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Curated Tours & Expeditions | SRM Car Rentals",
    description: "Handcrafted multi-day tours pairing our premium fleet with local insider knowledge.",
    alternates: { canonical: "/tours" },
  };
  const resolved = await getDynamicSeoForPath("/tours", fallback);
  return resolved.metadata;
}

export default async function ToursPage() {
  const [tours, locations, services] = await Promise.all([
    listActiveTours(100),
    listActiveLocations(),
    getAvailableServices(),
  ]);

  return (
    <div>
      <DynamicJsonLd path="/tours" />
      {/* Booking Widget — self-drive mode for finding a car to pair with a tour */}
      <div className="border-b border-white/5 bg-neutral-950 px-4 py-6 sm:px-6 lg:px-8">
        <BookingWidget
          locations={locations.map((l) => ({ id: l.id, name: l.name }))}
          defaultMode="self-drive"
          services={services}
        />
      </div>

      {tours.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white uppercase">Tours</h1>
          <p className="mt-4 text-white/40">No tours published yet — check back soon.</p>
        </div>
      ) : (
        <ToursSection tours={tours} />
      )}
    </div>
  );
}
