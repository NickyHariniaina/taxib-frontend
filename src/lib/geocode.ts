import type { LatLon } from './location';

export type Place = {
  /** Short label: first part of display_name. */
  name: string;
  /** Full "Analakely, Antananarivo, Madagascar" string. */
  displayName: string;
} & LatLon;

/**
 * Forward-geocode via Nominatim (OSM, free, no key), biased to Antananarivo.
 * Politeness: callers must debounce (~500ms) and abort stale requests —
 * Nominatim policy is ~1 req/s. Swap this function for Photon later
 * without touching any component.
 */
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
