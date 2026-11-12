import { API_URL } from './api';

/** One direction of a bus line, as returned by the API. */
export type BusLineVariant = {
  number: string;
  name: string;
  direction: string | null;
  origin: string | null;
  terminus: string | null;
  color: string | null;
  stopCount: number | null;
};

/** A bus line and its variants (Aller / Retour / Circulaire). */
export type BusLineGroup = {
  number: string;
  color: string | null;
  variants: BusLineVariant[];
};

/** A stop served by a line. */
export type LineStop = {
  id: number;
  name: string;
  neighborhood: string | null;
  lat: number;
  lon: number;
};

/** Every line variant, flat. */
export async function fetchLines(
  signal?: AbortSignal,
): Promise<BusLineVariant[]> {
  const res = await fetch(`${API_URL}/api/lines`, { signal });

  if (!res.ok) {
    throw new Error(`lines-fetch-failed (${res.status})`);
  }

  return res.json() as Promise<BusLineVariant[]>;
}

/** The stops a line number serves, both directions included. */
export async function fetchLineStops(
  number: string,
  signal?: AbortSignal,
): Promise<LineStop[]> {
  const res = await fetch(
    `${API_URL}/api/lines/${encodeURIComponent(number)}/stops`,
    { signal },
  );

  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    throw new Error(`line-stops-fetch-failed (${res.status})`);
  }

  return res.json() as Promise<LineStop[]>;
}

/** The lines serving a stop. Empty when the stop is served by none. */
export async function fetchLinesAtStop(
  stopId: number,
  signal?: AbortSignal,
): Promise<BusLineVariant[]> {
  const res = await fetch(`${API_URL}/api/stops/${stopId}/lines`, { signal });

  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    throw new Error(`stop-lines-fetch-failed (${res.status})`);
  }

  return res.json() as Promise<BusLineVariant[]>;
}

/** Groups variants by line number, so a line reads as one entry. */
export function groupByNumber(variants: BusLineVariant[]): BusLineGroup[] {
  const groups = new Map<string, BusLineVariant[]>();

  for (const variant of variants) {
    const list = groups.get(variant.number);
    if (list) list.push(variant);
    else groups.set(variant.number, [variant]);
  }

  return [...groups.entries()]
    .map(([number, list]) => ({
      number,
      color: list[0]?.color ?? null,
      variants: list,
    }))
    .sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true }),
    );
}

/** Keeps the groups whose number, name or endpoints match the search. */
export function filterGroups(
  groups: BusLineGroup[],
  query: string,
): BusLineGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;

  return groups.filter((group) => {
    if (group.number.toLowerCase().includes(needle)) return true;
    return group.variants.some((variant) =>
      [variant.name, variant.origin, variant.terminus].some((field) =>
        field?.toLowerCase().includes(needle),
      ),
    );
  });
}
