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

/** A variant returned for a point, with the distance to its nearest stop. */
export type NearbyLine = BusLineVariant & {
  /** Metres to the closest stop serving the line; null when unranked. */
  distanceM: number | null;
};

/** A line with a stop near both endpoints: a trip without a transfer. */
export type DirectLine = BusLineGroup & {
  /** Metres from the departure to its nearest stop on that line. */
  fromStartM: number | null;
  /** Metres from the arrival to its nearest stop on that line. */
  fromEndM: number | null;
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

/** Lines serving a stop within `radiusM` of a point, closest stop first. */
export async function fetchLinesNear(
  center: { lat: number; lon: number },
  opts?: { radiusM?: number; limit?: number; signal?: AbortSignal },
): Promise<NearbyLine[]> {
  const params = new URLSearchParams({
    lat: String(center.lat),
    lon: String(center.lon),
    radius: String(opts?.radiusM ?? 500),
    limit: String(opts?.limit ?? 200),
  });

  const res = await fetch(`${API_URL}/api/lines?${params}`, {
    signal: opts?.signal,
  });

  if (!res.ok) {
    throw new Error(`lines-near-fetch-failed (${res.status})`);
  }

  return res.json() as Promise<NearbyLine[]>;
}

/**
 * Lines that serve a stop near both points: a journey with no transfer.
 * Distances are the closest stop on each side, across the line's variants.
 */
export function intersectDirect(
  fromStart: NearbyLine[],
  fromEnd: NearbyLine[],
): DirectLine[] {
  const nearest = (lines: NearbyLine[]) => {
    const byNumber = new Map<string, number | null>();
    for (const line of lines) {
      const current = byNumber.get(line.number);
      if (current === undefined) {
        byNumber.set(line.number, line.distanceM);
      } else if (line.distanceM !== null) {
        byNumber.set(
          line.number,
          current === null ? line.distanceM : Math.min(current, line.distanceM),
        );
      }
    }
    return byNumber;
  };

  const startDistances = nearest(fromStart);
  const endDistances = nearest(fromEnd);

  const both = new Map<string, NearbyLine>();
  for (const line of [...fromStart, ...fromEnd]) {
    if (!startDistances.has(line.number) || !endDistances.has(line.number)) {
      continue;
    }
    const key = `${line.number}|${line.name}|${line.direction ?? ''}`;
    if (!both.has(key)) both.set(key, line);
  }

  return groupByNumber([...both.values()])
    .map((group) => ({
      ...group,
      fromStartM: startDistances.get(group.number) ?? null,
      fromEndM: endDistances.get(group.number) ?? null,
    }))
    .sort((a, b) => totalDistance(a) - totalDistance(b));
}

/** Walking distance to both stops, for ranking only. */
function totalDistance(line: DirectLine): number {
  return (line.fromStartM ?? 0) + (line.fromEndM ?? 0);
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
