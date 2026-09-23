import type { Metadata } from "next";

import { ChauffeurSection } from "@/components/website/chauffeur-section";
import { ChauffeurFilterSidebar } from "@/components/website/chauffeur-filter-sidebar";
import { listActiveChauffeurServices } from "@/modules/website/public-content.service";

export const metadata: Metadata = {
  title: "Chauffeur Driven Taxi & Car Rental Services",
  description:
    "Professional chauffeur-driven taxis, airport transfers, and outstation rentals with transparent per-trip and per-km pricing.",
  alternates: { canonical: "/car-rental" },
};

export default async function CarRentalPage() {
  const services = await listActiveChauffeurServices();

  // Derive unique categories from services
  const categories = Array.from(
    new Map(services.map((s) => [s.category, { name: s.category }])).values(),
  );

  return (
    <div>
      {services.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white uppercase">Chauffeur Services</h1>
          <p className="mt-4 text-white/40">No chauffeur services configured yet — check back soon.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {/* LEFT: Filter sidebar (Sticky) */}
            <div className="w-full lg:w-[260px] lg:shrink-0 lg:sticky lg:top-24 lg:self-start">
              <ChauffeurFilterSidebar
                categories={categories.map((c) => c.name)}
                total={services.length}
              />
            </div>

            {/* RIGHT: Chauffeur cards */}
            <div className="flex-1 min-w-0">
              <ChauffeurSection services={services} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
