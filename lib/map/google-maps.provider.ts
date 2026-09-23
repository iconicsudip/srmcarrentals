import type { LatLng, MapProvider } from "@/lib/map/map-provider";

/** Google Routes API-backed provider — real driving distance. Requires
 * GOOGLE_MAPS_API_KEY. Set MAP_PROVIDER=google to activate (see getMapProvider). */
export function createGoogleMapsProvider(apiKey: string): MapProvider {
  return {
    async getDistanceKm(origin: LatLng, destination: LatLng): Promise<number> {
      const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.distanceMeters",
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
          destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
          travelMode: "DRIVE",
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Routes API request failed: ${response.status}`);
      }

      const data = (await response.json()) as { routes?: { distanceMeters?: number }[] };
      const distanceMeters = data.routes?.[0]?.distanceMeters;
      if (typeof distanceMeters !== "number") {
        throw new Error("Google Routes API returned no distance");
      }

      return Math.round((distanceMeters / 1000) * 100) / 100;
    },
  };
}
