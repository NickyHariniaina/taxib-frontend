import type { LatLon } from './location';

export type Place = {
  name: string;
  displayName: string;
} & LatLon;

// View box to limit the nominatim search
const TANA_VIEWBOX = { left: 47.3, top: -18.7, right: 47.7, bottom: -19.1 };

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

export async function searchPlaces(query: string, opts?: { signal?: AbortSignal }): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'mg',
    viewbox: `${TANA_VIEWBOX.left},${TANA_VIEWBOX.top},${TANA_VIEWBOX.right},${TANA_VIEWBOX.bottom}`,
    bounded: '1',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    signal: opts?.signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`geocode-failed (${res.status})`);
  const items = (await res.json()) as NominatimResult[];
  return items.map((it) => ({
    name: it.display_name.split(',')[0]?.trim() || it.display_name,
    displayName: it.display_name,
    lat: Number(it.lat),
    lon: Number(it.lon),
  }));
}
