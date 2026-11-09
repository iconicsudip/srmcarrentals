/** Airport service has three prices: pickup only, drop-off only, or pickup + drop-off together (one bundle price). */
export type AirportMode = "PICKUP" | "DROP" | "BOTH";

export const AIRPORT_MODE_LABEL: Record<AirportMode, string> = {
  PICKUP: "Airport pickup",
  DROP: "Airport drop-off",
  BOTH: "Airport pickup & drop-off",
};

/** Which legs of the trip are at the airport. */
export const airportLegs = (mode: AirportMode | undefined) => ({
  pickup: mode !== "DROP",
  drop: mode !== "PICKUP",
});

interface HasAirport {
  deliveryType?: string;
  airportMode?: AirportMode;
  airportPickupCharge?: number;
  airportDropCharge?: number;
}

/** The airport line(s) to show for a set of cart items — one line per mode in use, never split into halves. */
export function airportLines(items: HasAirport[]): { label: string; amount: number }[] {
  const totals: Partial<Record<AirportMode, number>> = {};
  for (const it of items) {
    if (it.deliveryType !== "AIRPORT") continue;
    const mode = it.airportMode ?? "BOTH";
    totals[mode] = (totals[mode] ?? 0) + (it.airportPickupCharge ?? 0) + (it.airportDropCharge ?? 0);
  }
  return (["PICKUP", "DROP", "BOTH"] as AirportMode[]).filter((m) => totals[m] != null).map((m) => ({ label: AIRPORT_MODE_LABEL[m], amount: totals[m]! }));
}
