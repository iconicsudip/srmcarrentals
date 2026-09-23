export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Map provider abstraction — every distance-dependent pricing rule (airport
 * distance pricing today; anything location-based tomorrow) talks to this
 * interface, never to a specific provider's SDK. Swap `getMapProvider()`'s
 * implementation for Google Routes/Distance Matrix, Mapbox, etc. without
 * touching any pricing logic.
 */
export interface MapProvider {
  /** Driving distance in kilometers between two points. */
  getDistanceKm(origin: LatLng, destination: LatLng): Promise<number>;
}
