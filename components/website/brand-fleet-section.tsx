import Image from "next/image";
import type { CarCardData } from "@/components/website/car-card";
import { CarGridWithTabs } from "@/components/website/car-grid-with-tabs";
import { SectionHeading } from "@/components/website/section-heading";

interface BrandFleetSectionProps {
  cars: (CarCardData & { brand: { id: string; name: string } })[];
  brands: { id: string; name: string; carCount: number }[];
  totalCount: number;
}

export function BrandFleetSection({ cars, brands, totalCount }: BrandFleetSectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-white/5">
      {/* ── Background image: luxury car showroom / night city ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1800&q=70&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-10"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/95 via-neutral-950/80 to-neutral-950/95" />
      </div>

      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -left-40 top-1/3 size-[500px] rounded-full bg-orange-500/8 blur-[130px]" aria-hidden />
      <div className="pointer-events-none absolute -right-40 bottom-1/3 size-[400px] rounded-full bg-amber-400/6 blur-[110px]" aria-hidden />

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          badge="AUTOMOTIVE SELECTION"
          title="FIND YOUR FAVOURITE BRAND."
          subtitle="From precision engineering to invincible off-roaders, select your preferred badge for the journey."
          center
        />

        <div className="mt-10 w-full">
          <CarGridWithTabs
            cars={cars.map((car) => ({ ...car, tabId: car.brand.id }))}
            tabs={brands.map((b) => ({ id: b.id, label: b.name, count: b.carCount }))}
            viewAllHref="/cars"
            totalCount={totalCount}
            centerTabs
            twoRows
            showBasePriceOnly
          />
        </div>
      </div>
    </section>
  );
}
