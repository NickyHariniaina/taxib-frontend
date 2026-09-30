import type { LatLon } from './location';

export type Stop = {
  id: string;
  name: string;
  distanceM: number;
} & LatLon;

export type NearbyOptions = {
  radiusM?: number;
  limit?: number;
  signal?: AbortSignal;
};

const DEFAULT_RADIUS_M = 500;
const DEFAULT_LIMIT = 5;

// kumi instance: overpass-api.de rejects some clients (HTTP 406).
const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter';

/** Great-circle distance in meters. Good enough for sub-km ranking. */
export function haversineM(a: LatLon, b: LatLon): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

type OverpassNode = {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: { name?: string; ref?: string; highway?: string; public_transport?: string };
};

/**
 * SPIKE (frontend, throwaway transport): bus stops around a point, live from OSM.
 * Covers both tagging schemes (`highway=bus_stop` + PTv2 `public_transport=platform`).
 * Returns top-N by distance. Never a single "nearest", routing needs candidates.
 * The signature mirrors the future `GET /stops/nearby`; only this body moves backend.
 */
export async function findNearbyStops(
  center: LatLon,
  opts?: NearbyOptions,
): Promise<Stop[]> {
  const radiusM = opts?.radiusM ?? DEFAULT_RADIUS_M;
  const limit = opts?.limit ?? DEFAULT_LIMIT;
  const ql = `[out:json][timeout:25];(node["highway"="bus_stop"](around:${radiusM},${center.lat},${center.lon});node["public_transport"="platform"](around:${radiusM},${center.lat},${center.lon}););out tags;`;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data: ql }),
    signal: opts?.signal,
  });
  if (!res.ok) throw new Error(`stops-fetch-failed (${res.status})`);
  const json = (await res.json()) as { elements: OverpassNode[] };

  const seen = new Set<string>();
  const stops: Stop[] = [];
  for (const el of json.elements ?? []) {
    const key = `${el.type}/${el.id}`;
    if (seen.has(key) || typeof el.lat !== 'number' || typeof el.lon !== 'number') continue;
    seen.add(key);
    const p = { lat: el.lat, lon: el.lon };
    stops.push({
      id: key,
      name: el.tags?.name ?? el.tags?.ref ?? 'Unnamed stop',
      distanceM: Math.round(haversineM(center, p)),
      ...p,
    });
  }
  return stops.sort((a, b) => a.distanceM - b.distanceM).slice(0, limit);
}
