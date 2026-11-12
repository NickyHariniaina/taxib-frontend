import { API_URL } from './api';

export type Neighborhood = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

/** A bus stop belonging to a neighborhood, as returned by the API. */
export type NeighborhoodStop = {
  id: number;
  name: string;
  lat: number;
  lon: number;
};

export async function getNeighborhoods(
  signal?: AbortSignal,
): Promise<Neighborhood[]> {
  const response = await fetch(`${API_URL}/api/neighborhoods`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch neighborhoods (${response.status})`);
  }

  return response.json() as Promise<Neighborhood[]>;
}

/**
 * Stops of one neighborhood, ordered by name.
 *
 * A 404 means the backend has no neighborhood with that exact name, which is
 * an empty result rather than a failure.
 */
export async function getNeighborhoodStops(
  name: string,
  signal?: AbortSignal,
): Promise<NeighborhoodStop[]> {
  const response = await fetch(
    `${API_URL}/api/neighborhoods/${encodeURIComponent(name)}/stops`,
    { signal },
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch neighborhood stops (${response.status})`);
  }

  return response.json() as Promise<NeighborhoodStop[]>;
}
