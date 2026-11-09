import { prisma } from "@/lib/prisma";

/**
 * The fee row for an airport: the exact airport ↔ pickup-point fee when the point is known, otherwise the fee set for a
 * point in the same city (the location's city, or the airport's own city).
 */
export async function findAirportCharge(airportId: string, locationId: string | undefined) {
  if (locationId) {
    const exact = await prisma.airportLocationCharge.findUnique({ where: { airportId_locationId: { airportId, locationId } } });
    if (exact) return exact;
  }
  const [location, airport] = await Promise.all([
    locationId ? prisma.location.findUnique({ where: { id: locationId }, select: { city: true } }) : null,
    prisma.airport.findUnique({ where: { id: airportId }, select: { city: true } }),
  ]);
  const rows = await prisma.airportLocationCharge.findMany({
    where: { airportId },
    include: { location: { select: { city: true } } },
    orderBy: { createdAt: "asc" },
  });
  const inCity = (city: string | null | undefined) => {
    const c = (city ?? "").trim().toLowerCase();
    return c ? rows.find((r) => (r.location.city ?? "").trim().toLowerCase() === c) : undefined;
  };
  // 1) a fee for the other end's city, else 2) the airport's own city — so e.g. Jaipur airport still uses its Jaipur fee
  //    when the trip's other end is a branch in another city (that leg's own distance charge is separate).
  return inCity(location?.city) ?? inCity(airport?.city) ?? null;
}

export interface AirportFee {
  /** Pickup only */
  pickup: number;
  /** Drop-off only */
  drop: number;
  /** Pickup and drop-off together (its own price) */
  both: number;
  /** same as `both` — kept for the older callers */
  total: number;
  /** false when the admin has not set a fee for this airport yet */
  configured: boolean;
}

/** Pickup and drop fee for every active airport — shown to customers under the terminal picker. */
export async function getAirportFees(): Promise<Record<string, AirportFee>> {
  const airports = await prisma.airport.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
  const out: Record<string, AirportFee> = {};
  await Promise.all(
    airports.map(async (a) => {
      const row = await findAirportCharge(a.id, undefined);
      const pickup = row ? Number(row.pickupCharge) : 0;
      const drop = row ? Number(row.dropCharge) : 0;
      const bundle = row && Number(row.roundTripCharge ?? 0) > 0 ? Number(row.roundTripCharge) : pickup + drop;
      out[a.id] = { pickup, drop, both: bundle, total: bundle, configured: Boolean(row) };
    }),
  );
  return out;
}
