export type Neighborhood = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export async function getNeighborhoods(
  signal?: AbortSignal,
): Promise<Neighborhood[]> {
  const response = await fetch(`${API_URL}/api/neighborhoods`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch neighborhoods (${response.status})`);
  }

  return response.json() as Promise<Neighborhood[]>;
}

