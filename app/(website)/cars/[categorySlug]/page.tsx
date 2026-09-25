import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";
import { prisma } from "@/lib/prisma";

interface CategoryCarsPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: CategoryCarsPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await prisma.carCategory.findUnique({
    where: { slug: categorySlug },
  });

  const catName = category?.name || categorySlug.toUpperCase();
  const fallback: Metadata = {
    title: `${catName} Self Drive Car Rentals in Rajasthan | SRM Car Rentals`,
    description: `Rent ${catName} self-drive cars in Udaipur and Jaipur. Transparent daily pricing, flexible security deposits, and doorstep delivery.`,
    alternates: { canonical: `/cars/${categorySlug}` },
  };

  const resolved = await getDynamicSeoForPath(`/cars/${categorySlug}`, fallback);
  return resolved.metadata;
}

export default async function CategoryCarsPage({ params, searchParams }: CategoryCarsPageProps) {
  const { categorySlug } = await params;
  const sParams = await searchParams;

  const category = await prisma.carCategory.findUnique({
    where: { slug: categorySlug },
  });

  if (!category) {
    notFound();
  }

  const filters: PublicCarFilters = {
    categorySlug,
    brandSlug: sParams.brand,
    carTypeSlug: sParams.type,
    transmissionTypeId: sParams.transmission,
    fuelTypeId: sParams.fuel,
    search: sParams.search,
    sort: (sParams.sort as PublicCarFilters["sort"]) ?? "featured",
    page: sParams.page ? Number(sParams.page) : 1,
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
      Object.entries(sParams).filter(([, v]) => v !== undefined) as [string, string][],
    );
    if (targetPage > 1) next.set("page", String(targetPage));
    else next.delete("page");
    const qs = next.toString();
    return qs ? `/cars/${categorySlug}?${qs}` : `/cars/${categorySlug}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <DynamicJsonLd path={`/cars/${categorySlug}`} />
      <SectionHeading
        badge="CATEGORY FLEET"
        title={`${category.name.toUpperCase()} SELECTION`}
        subtitle={`Explore our verified ${category.name} self-drive vehicles available across Rajasthan.`}
      />

      {/* Two-column layout: filter sidebar left, grid right */}
      <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* LEFT: Filter sidebar */}
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
              <p className="text-white/40">No cars found in {category.name} — try adjusting other filters.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} searchParams={sParams} />
              ))}
            </div>
          )}

          <PaginationBar page={page} totalPages={totalPages} buildHref={buildHref} />
        </div>
      </div>
    </div>
  );
}
