type Loc = { name: string; city?: string | null; kind?: "CITY" | "POINT" };

const norm = (s?: string | null) => (s ?? "").replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase();

/**
 * A location named exactly like its city ("Udaipur" in Udaipur) is the city-level entry that ties cars to a city —
 * not a real pickup point. Drop it from pickup/drop lists unless it is the only location of that city.
 */
export function pickupPointsOnly<T extends Loc>(locations: T[]): T[] {
  const perCity = new Map<string, number>();
  for (const l of locations) perCity.set(norm(l.city), (perCity.get(norm(l.city)) ?? 0) + 1);
  return locations.filter((l) => {
    if (l.kind) return l.kind !== "CITY";
    return !(norm(l.name) === norm(l.city) && (perCity.get(norm(l.city)) ?? 0) > 1);
  });
}
