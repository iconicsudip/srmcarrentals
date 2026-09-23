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
} satisfies Prisma.CarInclude;

const CAR_LIST_INCLUDE = {
  brand: true,
  model: true,
  category: true,
  carType: true,
  images: { where: { isFeatured: true }, take: 1 },
  pricing: true,
} satisfies Prisma.CarInclude;

export interface CarListFilters {
  search?: string;
  status?: string;
  brandId?: string;
  categoryId?: string;
  carTypeId?: string;
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
    ...(filters.isFeatured !== undefined ? { isFeatured: filters.isFeatured } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.car.findMany({
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
  const { featureIds: _featureIds, safetyFeatureIds: _safetyFeatureIds, slug: _slug, ...rest } = input;
  return rest;
}

function updateScalarFields(input: UpdateCarInput) {
  const { featureIds: _featureIds, safetyFeatureIds: _safetyFeatureIds, slug: _slug, ...rest } = input;
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

    return tx.car.findUniqueOrThrow({ where: { id: car.id }, include: CAR_DETAIL_INCLUDE });
  });
}

export async function updateCar(id: string, input: UpdateCarInput) {
  const existing = await prisma.car.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Car not found");

  const slug = input.name || input.slug ? await uniqueSlug(input.name ?? existing.name, input.slug, id) : undefined;

  return prisma.$transaction(async (tx) => {
    await tx.car.update({
      where: { id },
      data: { ...updateScalarFields(input), ...(slug ? { slug } : {}) },
    });

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

    return tx.car.findUniqueOrThrow({ where: { id }, include: CAR_DETAIL_INCLUDE });
  });
}

export async function deleteCar(id: string) {
  const existing = await prisma.car.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Car not found");
  await prisma.car.delete({ where: { id } });
}
