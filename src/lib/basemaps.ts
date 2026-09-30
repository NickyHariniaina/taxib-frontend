import type { StyleSpecification } from 'maplibre-gl';

/** Esri World Imagery — free raster tiles, attribution required. */
export const ESRI_IMAGERY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const ESRI_ATTRIBUTION =
  'Imagery &copy; Esri, Maxar, Earthstar Geographics';

/** AWS elevation tiles, terrarium encoding (R/G/B decode to meters). Free, no key. */
export const AWS_TERRAIN_URL =
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

/**
 * 3D satellite style: Esri imagery draped over real elevation.
 * - `imagery` raster layer = the photo.
 * - `terrainSource` raster-dem = terrarium pixels decoded to meters.
 * - `terrain: { exaggeration: 0.35 }` = gentle relief. Tana's hills are modest;
 *   1.0 turns them into the Alps, and a hillshade overlay on top of a photo
 *   doubles the rugged look — so no hillshade layer, the photo has texture.
 * - `sky` = atmosphere so the horizon doesn't render black at low pitch.
 */
export function satellite3DStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      imagery: {
        type: 'raster',
        tiles: [ESRI_IMAGERY_URL],
        tileSize: 256,
        attribution: ESRI_ATTRIBUTION,
        maxzoom: 19,
      },
      terrainSource: {
        type: 'raster-dem',
        tiles: [AWS_TERRAIN_URL],
        tileSize: 256,
        attribution: 'Terrain &copy; Mapzen / AWS',
        maxzoom: 15,
        // Terrarium pixels decode as R*256 + G + B/256 − 32768. MapLibre
        // defaults to Mapbox RGB decoding — without this, every pixel
        // decodes to garbage elevation and the city turns into spikes.
        encoding: 'terrarium',
      },
    },
    layers: [{ id: 'imagery', type: 'raster', source: 'imagery' }],
    terrain: { source: 'terrainSource', exaggeration: 0.35 },
    sky: {},
  };
}
