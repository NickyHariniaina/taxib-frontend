import type { LatLon } from './location';

/** Stub until backend GET /journeys exists. Keeps the API boundary stable. */
export async function fetchJourneys(from: LatLon, to: LatLon): Promise<never[]> {
  console.log('fetchJourneys stub', from, to);
  return [];
}
