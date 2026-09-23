import { getEnv } from "@/lib/env";
import { createGoogleMapsProvider } from "@/lib/map/google-maps.provider";
import { haversineMapProvider } from "@/lib/map/haversine.provider";
import type { MapProvider } from "@/lib/map/map-provider";

export type { LatLng, MapProvider } from "@/lib/map/map-provider";

let cached: MapProvider | null = null;

/** Resolves the active MapProvider from admin/env configuration. Falls back
 * to the zero-config Haversine provider if Google isn't set up, so airport
 * distance pricing always works out of the box in development. */
export function getMapProvider(): MapProvider {
  if (cached) return cached;

  const env = getEnv();
  if (env.MAP_PROVIDER === "google" && env.GOOGLE_MAPS_API_KEY) {
    cached = createGoogleMapsProvider(env.GOOGLE_MAPS_API_KEY);
  } else {
    cached = haversineMapProvider;
  }

  return cached;
}
