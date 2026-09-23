import type { Metadata } from "next";

import { CarCard } from "@/components/website/car-card";
import { CarsFilterBar } from "@/components/website/cars-filter-bar";
import { PaginationBar } from "@/components/website/pagination-bar";
import { SectionHeading } from "@/components/website/section-heading";
import {
  listActiveBrandsWithCarCounts,
  listActiveCarTypes,
  listActiveCategories,
  listActiveFuelTypes,
  listActiveLocations,
  listActiveTransmissionTypes,
  listPublicCars,
  type PublicCarFilters,
} from "@/modules/website/public-content.service";

export const metadata: Metadata = {
  title: "Self Drive Car Rentals — Browse Our Fleet",
  description: "Browse our full self-drive fleet with transparent 24-hour pricing, filter by brand, category, and transmission.",
  alternates: { canonical: "/cars" },
};

interface CarsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CarsPage({ searchParams }: CarsPageProps) {
  const params = await searchParams;

  const filters: PublicCarFilters = {
    categorySlug: params.category,
    brandSlug: params.brand,
    carTypeSlug: params.type,
    transmissionTypeId: params.transmission,
    fuelTypeId: params.fuel,
    search: params.search,
    sort: (params.sort as PublicCarFilters["sort"]) ?? "featured",
    page: params.page ? Number(params.page) : 1,
  };

  const [{ cars, total, page, pageSize }, categories, brands, carTypes, transmissionTypes, fuelTypes, locations] =
    await Promise.all([
      listPublicCars(filters),
      listActiveCategories(),
      listActiveBrandsWithCarCounts(),
      listActiveCarTypes(),
      listActiveTransmissionTypes(),
      listActiveFuelTypes(),
      listActiveLocations(),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildHref(targetPage: number) {
    const next = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][],
    );
    if (targetPage > 1) next.set("page", String(targetPage));
    else next.delete("page");
    const qs = next.toString();
    return qs ? `/cars?${qs}` : "/cars";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading
        badge="AUTOMOTIVE SELECTION"
        title="YOUR CAR. YOUR JOURNEY."
        subtitle="Choose from a premium self-drive fleet, filtered your way."
      />

      {/* Two-column layout: filter sidebar left, grid right */}
      <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* LEFT: Filter sidebar (Sticky) */}
        <div className="w-full lg:w-[280px] xl:w-[320px] lg:shrink-0 lg:sticky lg:top-24 lg:self-start">
          <CarsFilterBar
            categories={categories}
            brands={brands.map((b) => ({ slug: b.slug, name: `${b.name} (${b.carCount})` }))}
            carTypes={carTypes}
            transmissionTypes={transmissionTypes}
            fuelTypes={fuelTypes}
            locations={locations}
            total={total}
          />
        </div>

        {/* RIGHT: Car grid + pagination */}
        <div className="flex-1 min-w-0 flex flex-col gap-8">
          {cars.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-neutral-900/50 py-24 text-center">
              <p className="text-white/40">No cars match these filters — try adjusting them.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} searchParams={params} />
              ))}
            </div>
          )}

          <PaginationBar page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </div>
    </div>
  );
}
