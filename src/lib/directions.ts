import type { LatLon } from './location';

export type RoadPath = {
  /** Ordered road geometry, origin → destination. */
  path: LatLon[];
  distanceM: number;
  durationS: number;
};

// Public OSRM demo server: free, no key, reasonable-use limits.
// Display scaffolding only: road geometry, not transit routing.
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

type OsrmResponse = {
  code: string;
  routes?: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }[];
};

/**
 * Road path between two points (driving profile approximates bus roads).
 * Throws `route-not-found` when OSRM can't connect them.
 */
export async function getRoadPath(
  from: LatLon,
  to: LatLon,
  opts?: { signal?: AbortSignal },
): Promise<RoadPath> {
  const url =
    `${OSRM_URL}/${from.lon},${from.lat};${to.lon},${to.lat}` +
    `?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal: opts?.signal });
  if (!res.ok) throw new Error(`directions-failed (${res.status})`);
  const json = (await res.json()) as OsrmResponse;
  const route = json.code === 'Ok' ? json.routes?.[0] : undefined;
  if (!route) throw new Error('route-not-found');
  return {
    path: route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
    distanceM: Math.round(route.distance),
    durationS: Math.round(route.duration),
  };
}

export function formatTrip(distanceM: number, durationS: number): string {
  const km = (distanceM / 1000).toFixed(1);
  const min = Math.max(1, Math.round(durationS / 60));
  return `${min} min · ${km} km by road`;
}
