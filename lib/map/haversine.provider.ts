import type { LatLng, MapProvider } from "@/lib/map/map-provider";

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Default, zero-configuration map provider: great-circle (as-the-crow-flies)
 * distance via the Haversine formula. Always available (no API key), used as
 * the fallback when no real routing provider is configured — swap in
 * GoogleMapsProvider for actual driving distances. */
export const haversineMapProvider: MapProvider = {
  async getDistanceKm(origin: LatLng, destination: LatLng): Promise<number> {
    const dLat = toRadians(destination.latitude - origin.latitude);
    const dLng = toRadians(destination.longitude - origin.longitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(origin.latitude)) * Math.cos(toRadians(destination.latitude)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
  },
};
