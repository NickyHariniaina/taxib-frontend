import type { LatLon } from './location';

export type BusLine = {
  /** Line ref, e.g. "112" (variants A/R grouped under one ref). */
  ref: string;
  /** Direction names, e.g. ["Ligne 112 Andranoro > Analakely", ...]. */
  directions: string[];
};

export type LinesOptions = {
  radiusM?: number;
  signal?: AbortSignal;
};

const DEFAULT_RADIUS_M = 1000;

// kumi instance: overpass-api.de rejects some clients (HTTP 406).
const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter';

type OverpassRelation = {
  type: string;
  id: number;
  tags?: { ref?: string; name?: string };
};

/**
 * SPIKE: bus lines passing near a point, live from OSM route relations.
 * Groups A/R variants under one ref. No member parsing: cheap bbox query.
 * Signature mirrors the future backend; only this body moves.
 */
export async function findLinesNear(center: LatLon, opts?: LinesOptions): Promise<BusLine[]> {
  const radiusM = opts?.radiusM ?? DEFAULT_RADIUS_M;
  const ql = `[out:json][timeout:60];relation["route"="bus"](around:${radiusM},${center.lat},${center.lon});out tags;`;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data: ql }),
    signal: opts?.signal,
  });
  if (!res.ok) throw new Error(`lines-fetch-failed (${res.status})`);
  const json = (await res.json()) as { elements: OverpassRelation[] };

  const byRef = new Map<string, Set<string>>();
  for (const el of json.elements ?? []) {
    const ref = (el.tags?.ref ?? '').trim();
    if (!ref) continue;
    const name = (el.tags?.name ?? ref).trim();
    if (!byRef.has(ref)) byRef.set(ref, new Set());
    byRef.get(ref)?.add(name);
  }
  return [...byRef.entries()]
    .map(([ref, names]) => ({ ref, directions: [...names].sort() }))
    .sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true }));
}

/** Line refs present near BOTH endpoints = no-transfer candidates. */
export function directLines(a: BusLine[], b: BusLine[]): BusLine[] {
  const refsB = new Set(b.map((l) => l.ref));
  return a.filter((l) => refsB.has(l.ref));
}
