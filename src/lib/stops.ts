import { API_URL } from './api';
import type { LatLon } from './location';

/** A stop as drawn on the map. */
export type MapStop = {
  id: number;
  name: string;
} & LatLon;

/** A stop near an endpoint, as returned by the API. */
export type Stop = MapStop & {
  /** Quartier the stop belongs to. */
  neighborhood: string;
  distanceM: number;
};

export type NearbyOptions = {
  radiusM?: number;
  limit?: number;
  signal?: AbortSignal;
};

const DEFAULT_RADIUS_M = 500;
const DEFAULT_LIMIT = 5;

/**
 * Stops near a point, closest first. The API ranks them by straight-line
 * distance from the point.
 */
export async function findNearbyStops(
  center: LatLon,
  opts?: NearbyOptions,
): Promise<Stop[]> {
  const params = new URLSearchParams({
    lat: String(center.lat),
    lon: String(center.lon),
    radius: String(opts?.radiusM ?? DEFAULT_RADIUS_M),
    limit: String(opts?.limit ?? DEFAULT_LIMIT),
  });

  const res = await fetch(`${API_URL}/api/stops?${params}`, {
    signal: opts?.signal,
  });

  if (!res.ok) {
    throw new Error(`stops-fetch-failed (${res.status})`);
  }

  return res.json() as Promise<Stop[]>;
}
