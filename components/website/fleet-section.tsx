import type { CarCardData } from "@/components/website/car-card";
import { FleetShowcase } from "@/components/website/fleet-showcase";

interface FleetSectionProps {
  cars: (CarCardData & { category: { id: string; name: string } })[];
  categories: { id: string; name: string }[];
  totalCount: number;
}

export function FleetSection({ cars, categories, totalCount }: FleetSectionProps) {
  return (
    <section id="fleet" className="relative overflow-hidden bg-neutral-950 text-white lg:[clip-path:polygon(0_0,100%_48px,100%_calc(100%-48px),0_100%)] lg:-my-6">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-[64rem] max-w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.22),transparent_65%)]" aria-hidden />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 bg-[radial-gradient(circle,rgba(251,191,36,0.12),transparent_65%)]" aria-hidden />
      <span
        aria-hidden
        className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 text-[22vw] leading-none font-black tracking-tighter text-transparent select-none [-webkit-text-stroke:1px_rgba(255,255,255,0.05)] lg:text-[18rem]"
      >
        FLEET
      </span>

      <div className="relative mx-auto max-w-[1520px] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mb-10 flex max-w-2xl flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/40 bg-white/10 px-3.5 py-1 text-[11px] font-bold tracking-[0.25em] text-amber-300 uppercase backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" /> Self drive fleet
          </span>
          <h2 className="text-3xl leading-[1.02] font-black tracking-tight uppercase sm:text-5xl">
            Your car. Your journey<span className="text-orange-500">.</span>
          </h2>
          <span className="lux-rule" />
          <p className="max-w-xl text-sm text-white/65 sm:text-base">
            Pick a ride from the filmstrip — every car is cleaned, insured and ready for delivery.
          </p>
        </div>

        <FleetShowcase
          cars={cars.map((car) => ({ ...car, tabId: car.category.id }))}
          tabs={categories.map((c) => ({ id: c.id, label: c.name }))}
          viewAllHref="/cars"
          totalCount={totalCount}
        />
      </div>
    </section>
  );
}
