import Image from "next/image";
import type { CarCardData } from "@/components/website/car-card";
import { CarGridWithTabs } from "@/components/website/car-grid-with-tabs";
import { SectionHeading } from "@/components/website/section-heading";

interface FleetSectionProps {
  cars: (CarCardData & { category: { id: string; name: string } })[];
  categories: { id: string; name: string }[];
  totalCount: number;
}

export function FleetSection({ cars, categories, totalCount }: FleetSectionProps) {
  return (
    <section id="fleet" className="relative overflow-hidden border-t border-white/5">
      {/* ── Background image: open road / desert highway ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1800&q=70&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-8"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/98 via-neutral-950/85 to-neutral-950/98" />
      </div>

      {/* Subtle orange glow — bottom center */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 size-[700px] -translate-x-1/2 rounded-full bg-orange-500/8 blur-[150px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            badge="SELF DRIVE FLEET"
            title="YOUR CAR. YOUR JOURNEY."
            subtitle="Choose from a premium fleet built for every kind of drive."
          />
        </div>

        <div className="mt-10">
          <CarGridWithTabs
            cars={cars.map((car) => ({ ...car, tabId: car.category.id }))}
            tabs={categories.map((c) => ({ id: c.id, label: c.name }))}
            viewAllHref="/cars"
            totalCount={totalCount}
            twoRows
            showBasePriceOnly
          />
        </div>
      </div>
    </section>
  );
}
