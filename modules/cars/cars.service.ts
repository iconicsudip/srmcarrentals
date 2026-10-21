import type { Prisma } from "@prisma/client";
import { generateSlug, makeSlugUnique } from "@srm/utils";

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/http/errors";
import type { PaginationParams } from "@/lib/http/pagination";
import type { CreateCarInput, UpdateCarInput } from "@/modules/cars/cars.schemas";

const CAR_DETAIL_INCLUDE = {
  brand: true,
  model: true,
  category: true,
  carType: true,
  seatOption: true,
  doorOption: true,
  cylinderOption: true,
  transmissionType: true,
  fuelType: true,
  steeringType: true,
  carCapacity: true,
  color: true,
  exteriorColor: true,
  interiorColor: true,
  features: { include: { feature: true } },
  safetyFeatures: { include: { safetyFeature: true } },
  images: { orderBy: { sortOrder: "asc" } },
  pricing: true,
  locations: { include: { location: true } },
} satisfies Prisma.CarInclude;

const CAR_LIST_INCLUDE = {
  brand: true,
  model: true,
  category: true,
  carType: true,
  images: { orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }], take: 1 },
  pricing: true,
  locations: { include: { location: true } },
} satisfies Prisma.CarInclude;

export interface CarListFilters {
  search?: string;
  status?: string;
  brandId?: string;
  categoryId?: string;
  carTypeId?: string;
  locationId?: string;
  isFeatured?: boolean;
}

export async function listCars(pagination: PaginationParams, filters: CarListFilters) {
  const where: Prisma.CarWhereInput = {
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { shortDescription: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.status ? { status: filters.status as Prisma.EnumCarStatusFilter["equals"] } : {}),
    ...(filters.brandId ? { brandId: filters.brandId } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.carTypeId ? { carTypeId: filters.carTypeId } : {}),
    ...(filters.locationId
      ? {
          OR: [
            { locations: { some: { locationId: filters.locationId } } },
            { locations: { none: {} } },
          ],
        }
      : {}),
    ...(filters.isFeatured !== undefined ? { isFeatured: filters.isFeatured } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.car.findMany({
      relationLoadStrategy: "join", // one SQL query for all relations (fewer DB round-trips)
      where,
      include: CAR_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.car.count({ where }),
  ]);

  return { data, total };
}

export async function getCarById(id: string) {
  const car = await prisma.car.findUnique({ where: { id }, include: CAR_DETAIL_INCLUDE });
  if (!car) throw new NotFoundError("Car not found");
  return car;
}

export async function getCarBySlug(slug: string) {
  const car = await prisma.car.findUnique({ where: { slug }, include: CAR_DETAIL_INCLUDE });
  if (!car) throw new NotFoundError("Car not found");
  return car;
}

async function uniqueSlug(name: string, providedSlug?: string, excludeId?: string): Promise<string> {
  const base = providedSlug?.trim() || generateSlug(name);
  let attempt = 0;
  let candidate = base;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.car.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    attempt += 1;
    candidate = makeSlugUnique(base, attempt);
  }
}

function createScalarFields(input: CreateCarInput) {
  const { featureIds: _featureIds, safetyFeatureIds: _safetyFeatureIds, locationIds: _locationIds, slug: _slug, ...rest } = input;
  return rest;
}

function updateScalarFields(input: UpdateCarInput) {
  const { featureIds: _featureIds, safetyFeatureIds: _safetyFeatureIds, locationIds: _locationIds, slug: _slug, ...rest } = input;
  return rest;
}

export async function createCar(input: CreateCarInput) {
  const slug = await uniqueSlug(input.name, input.slug);

  return prisma.$transaction(async (tx) => {
    const car = await tx.car.create({
      data: { ...createScalarFields(input), slug },
    });

    if (input.featureIds.length > 0) {
      await tx.carFeatureOnCar.createMany({
        data: input.featureIds.map((featureId) => ({ carId: car.id, featureId })),
        skipDuplicates: true,
      });
    }
    if (input.safetyFeatureIds.length > 0) {
      await tx.carSafetyFeatureOnCar.createMany({
        data: input.safetyFeatureIds.map((safetyFeatureId) => ({ carId: car.id, safetyFeatureId })),
        skipDuplicates: true,
      });
    }

    if (input.locationIds && input.locationIds.length > 0) {
      await tx.carLocation.createMany({
        data: input.locationIds.map((locationId) => ({ carId: car.id, locationId })),
        skipDuplicates: true,
      });
    }

    return tx.car.findUniqueOrThrow({ where: { id: car.id }, include: CAR_DETAIL_INCLUDE });
  });
}

async function moveCarSeoToNewSlug(tx: Prisma.TransactionClient, oldSlug: string, newSlug: string) {
  const oldPath = `/car/${oldSlug}`;
  const newPath = `/car/${newSlug}`;
  const oldKey = `seo.page.${encodeURIComponent(oldPath)}`;
  const row = await tx.setting.findUnique({ where: { key: oldKey } });
  if (!row) return;
  const value: Record<string, unknown> = { ...(row.value as Record<string, unknown>), path: newPath };
  if (typeof value.canonicalUrl === "string") value.canonicalUrl = value.canonicalUrl.split(oldPath).join(newPath);
  await tx.setting.upsert({
    where: { key: `seo.page.${encodeURIComponent(newPath)}` },
    create: { key: `seo.page.${encodeURIComponent(newPath)}`, value: value as Prisma.InputJsonValue, group: "seo" },
    update: { value: value as Prisma.InputJsonValue },
  });
  await tx.setting.delete({ where: { key: oldKey } });
}

export async function updateCar(id: string, input: UpdateCarInput) {
  const existing = await prisma.car.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Car not found");

  const slug = input.name || input.slug ? await uniqueSlug(input.name ?? existing.name, input.slug, id) : undefined;

  const slugChanged = !!slug && slug !== existing.slug;

  return prisma.$transaction(async (tx) => {
    await tx.car.update({
      where: { id },
      data: { ...updateScalarFields(input), ...(slug ? { slug } : {}) },
    });

    // The car's page-wise SEO is stored under its URL — move it to the new URL so it isn't lost
    if (slugChanged) await moveCarSeoToNewSlug(tx, existing.slug, slug!);

    if (input.featureIds) {
      await tx.carFeatureOnCar.deleteMany({ where: { carId: id } });
      if (input.featureIds.length > 0) {
        await tx.carFeatureOnCar.createMany({
          data: input.featureIds.map((featureId) => ({ carId: id, featureId })),
          skipDuplicates: true,
        });
      }
    }

    if (input.safetyFeatureIds) {
      await tx.carSafetyFeatureOnCar.deleteMany({ where: { carId: id } });
      if (input.safetyFeatureIds.length > 0) {
        await tx.carSafetyFeatureOnCar.createMany({
          data: input.safetyFeatureIds.map((safetyFeatureId) => ({ carId: id, safetyFeatureId })),
          skipDuplicates: true,
        });
      }
    }

    if (input.locationIds !== undefined) {
      await tx.carLocation.deleteMany({ where: { carId: id } });
      if (input.locationIds.length > 0) {
        await tx.carLocation.createMany({
          data: input.locationIds.map((locationId) => ({ carId: id, locationId })),
          skipDuplicates: true,
        });
      }
    }

    return tx.car.findUniqueOrThrow({ where: { id }, include: CAR_DETAIL_INCLUDE });
  });
}

export async function deleteCar(id: string) {
  const existing = await prisma.car.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Car not found");
  await prisma.car.delete({ where: { id } });
}
