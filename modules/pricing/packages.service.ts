import type { Prisma } from "@prisma/client";
import { generateSlug, makeSlugUnique } from "@srm/utils";

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/http/errors";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import type { CreateRentalPackageInput, UpdateRentalPackageInput } from "@/modules/pricing/packages.schemas";

const PACKAGE_INCLUDE = { carCategory: true, carType: true, cars: { include: { car: true } } } as const;

async function uniqueSlug(name: string, providedSlug?: string, excludeId?: string): Promise<string> {
  const base = providedSlug?.trim() || generateSlug(name);
  let attempt = 0;
  let candidate = base;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.rentalPackage.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    attempt += 1;
    candidate = makeSlugUnique(base, attempt);
  }
}

export async function listRentalPackages(req: Request) {
  const url = new URL(req.url);
  const { page, limit, skip, take } = parsePagination(url);
  const status = url.searchParams.get("status");

  const where: Prisma.RentalPackageWhereInput =
    status === "ACTIVE" || status === "INACTIVE" ? { status } : {};

  const [data, total] = await prisma.$transaction([
    prisma.rentalPackage.findMany({ where, include: PACKAGE_INCLUDE, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.rentalPackage.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function createRentalPackage(input: CreateRentalPackageInput) {
  const slug = await uniqueSlug(input.name, input.slug);
  const { carIds, ...rest } = input;

  return prisma.rentalPackage.create({
    data: {
      ...rest,
      slug,
      cars: carIds && carIds.length > 0 ? { create: carIds.map((carId) => ({ carId })) } : undefined,
    },
    include: PACKAGE_INCLUDE,
  });
}

export async function updateRentalPackage(id: string, input: UpdateRentalPackageInput) {
  const existing = await prisma.rentalPackage.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Rental package not found");

  const slug = input.name || input.slug ? await uniqueSlug(input.name ?? existing.name, input.slug, id) : undefined;
  const { carIds, ...rest } = input;

  return prisma.$transaction(async (tx) => {
    await tx.rentalPackage.update({ where: { id }, data: { ...rest, ...(slug ? { slug } : {}) } });

    if (carIds) {
      await tx.rentalPackageCar.deleteMany({ where: { packageId: id } });
      if (carIds.length > 0) {
        await tx.rentalPackageCar.createMany({ data: carIds.map((carId) => ({ packageId: id, carId })), skipDuplicates: true });
      }
    }

    return tx.rentalPackage.findUniqueOrThrow({ where: { id }, include: PACKAGE_INCLUDE });
  });
}

export async function deleteRentalPackage(id: string) {
  const existing = await prisma.rentalPackage.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Rental package not found");
  await prisma.rentalPackage.delete({ where: { id } });
}
