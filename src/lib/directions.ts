import type { LatLon } from './location';

export type RoadPath = {
  path: LatLon[];
  distanceM: number;
};

// TODO: Put in env
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

type OsrmResponse = {
  code: string;
  routes?: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }[];
};

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
  };
}

export function formatTrip(distanceM: number): string {
  const km = (distanceM / 1000).toFixed(1);
  return `${km} km`;
}
