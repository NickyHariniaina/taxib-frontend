import type { FeatureCollection, Polygon } from 'geojson';

/**
 * Demo stop pillars for the 3D view — approximate major Tana hubs.
 * Stand-in until the backend serves real `stops` via API; same layer code
 * will render live data later. Coordinates are approximate, not surveyed.
 */
export type StopPillar = {
  name: string;
  lon: number;
  lat: number;
  /** Pillar height in meters — tall on purpose, these are markers not buildings. */
  height: number;
};

export const DEMO_STOPS: StopPillar[] = [
  { name: 'Analakely', lon: 47.528, lat: -18.9105, height: 120 },
  { name: 'Mahamasina', lon: 47.5243, lat: -18.9136, height: 100 },
  { name: 'Anosy', lon: 47.5222, lat: -18.9183, height: 100 },
  { name: 'Andohatapenaka', lon: 47.5125, lat: -18.898, height: 90 },
];

const HALF_SIZE_DEG = 0.00035; // ~35m square at Tana's latitude

/** A stop rendered as a small square footprint; height comes via properties. */
export function stopsToBoxes(stops: StopPillar[]): FeatureCollection<Polygon> {
  return {
    type: 'FeatureCollection',
    features: stops.map((s) => ({
      type: 'Feature',
      properties: { name: s.name, height: s.height, color: '#ffc531' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [s.lon - HALF_SIZE_DEG, s.lat - HALF_SIZE_DEG],
            [s.lon + HALF_SIZE_DEG, s.lat - HALF_SIZE_DEG],
            [s.lon + HALF_SIZE_DEG, s.lat + HALF_SIZE_DEG],
            [s.lon - HALF_SIZE_DEG, s.lat + HALF_SIZE_DEG],
            [s.lon - HALF_SIZE_DEG, s.lat - HALF_SIZE_DEG],
          ],
        ],
      },
    })),
  };
}
