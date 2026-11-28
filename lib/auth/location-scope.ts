import type { Prisma } from "@prisma/client";

import type { AccessTokenPayload } from "@/lib/auth/jwt";
import { ForbiddenError } from "@/lib/http/errors";
import { prisma } from "@/lib/prisma";

/** The places a restricted staff member may work with. `null` means "no restriction". */
export interface LocationScope {
  /** Pickup / drop point ids (cities are expanded to the points inside them) */
  locationIds: string[];
  /** City names — used for airport bookings, which are tied to a city rather than a point */
  cities: string[];
}

/**
 * The location limit for a signed-in user. Super admins and users without "restrict to locations" see everything.
 * A city assigned to a user covers every pickup point in that city.
 */
export async function getLocationScope(session: AccessTokenPayload): Promise<LocationScope | null> {
  if (session.role === "SUPER_ADMIN") return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { restrictToLocations: true, locations: { select: { location: { select: { id: true, kind: true, city: true } } } } },
  });
  if (!user?.restrictToLocations) return null;

  const assigned = user.locations.map((l) => l.location);
  const cities = Array.from(new Set(assigned.map((l) => (l.city ?? "").trim()).filter(Boolean)));
  const ids = new Set(assigned.map((l) => l.id));

  const cityNames = assigned.filter((l) => l.kind === "CITY").map((l) => l.city);
  if (cityNames.length > 0) {
    const points = await prisma.location.findMany({ where: { kind: "POINT", city: { in: cityNames } }, select: { id: true } });
    for (const p of points) ids.add(p.id);
  }
  // restricted but nothing assigned → sees nothing (never "everything" by accident)
  return { locationIds: Array.from(ids), cities };
}

/** Prisma filter that keeps only the bookings inside the scope: by pickup/drop point, or by the airport's city. */
export function bookingScopeWhere(scope: LocationScope | null): Prisma.BookingWhereInput {
  if (!scope) return {};
  const byCity = scope.cities.flatMap((city) => [
    { pickupAirport: { city: { contains: city, mode: "insensitive" as const } } },
    { dropAirport: { city: { contains: city, mode: "insensitive" as const } } },
  ]);
  return {
    OR: [
      { pickupLocationId: { in: scope.locationIds } },
      { dropLocationId: { in: scope.locationIds } },
      ...byCity,
    ],
  };
}

/** Throws unless the booking is inside the user's scope (a 403 that does not reveal whether the booking exists). */
export async function assertBookingInScope(session: AccessTokenPayload, bookingId: string): Promise<void> {
  const scope = await getLocationScope(session);
  if (!scope) return;
  const hit = await prisma.booking.count({ where: { id: bookingId, ...bookingScopeWhere(scope) } });
  if (hit === 0) throw new ForbiddenError("This booking belongs to a location you do not manage");
}
