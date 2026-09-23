import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/http/errors";
import type { CarPricingInput } from "@/modules/pricing/car-pricing.schemas";

export function getCarPricing(carId: string) {
  return prisma.carPricing.findUnique({ where: { carId } });
}

export async function upsertCarPricing(carId: string, input: CarPricingInput) {
  const car = await prisma.car.findUnique({ where: { id: carId }, select: { id: true } });
  if (!car) throw new NotFoundError("Car not found");

  return prisma.carPricing.upsert({
    where: { carId },
    create: { carId, ...input },
    update: input,
  });
}
