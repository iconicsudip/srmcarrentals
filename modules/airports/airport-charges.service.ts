import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/http/errors";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import type {
  CreateAirportChargeInput,
  UpdateAirportChargeInput,
} from "@/modules/airports/airport-charges.schemas";

const CHARGE_INCLUDE = { airport: true, location: true } as const;

export async function listAirportCharges(req: Request) {
  const url = new URL(req.url);
  const { page, limit, skip, take } = parsePagination(url);
  const airportId = url.searchParams.get("airportId");
  const locationId = url.searchParams.get("locationId");

  const where = {
    ...(airportId ? { airportId } : {}),
    ...(locationId ? { locationId } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.airportLocationCharge.findMany({ where, include: CHARGE_INCLUDE, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.airportLocationCharge.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export function createAirportCharge(input: CreateAirportChargeInput) {
  return prisma.airportLocationCharge.create({ data: input, include: CHARGE_INCLUDE });
}

export async function updateAirportCharge(id: string, input: UpdateAirportChargeInput) {
  const existing = await prisma.airportLocationCharge.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Airport charge not found");
  return prisma.airportLocationCharge.update({ where: { id }, data: input, include: CHARGE_INCLUDE });
}

export async function deleteAirportCharge(id: string) {
  const existing = await prisma.airportLocationCharge.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Airport charge not found");
  await prisma.airportLocationCharge.delete({ where: { id } });
}

/** Distance-based fallback pricing, one row per airport (1-1). */
export async function upsertAirportDistancePricing(
  airportId: string,
  input: { baseCharge: number; includedKm: number; extraKmPrice: number; status?: "ACTIVE" | "INACTIVE" },
) {
  return prisma.airportDistancePricing.upsert({
    where: { airportId },
    create: { airportId, ...input },
    update: input,
  });
}

export function getAirportDistancePricing(airportId: string) {
  return prisma.airportDistancePricing.findUnique({ where: { airportId } });
}
