import type { LatLon } from './location';

// stub
// TODO: I have to change the never[] to actually something real.
export async function fetchJourneys(from: LatLon, to: LatLon): Promise<never[]> {
  console.log('fetchJourneys stub', from, to);
  return [];
}
