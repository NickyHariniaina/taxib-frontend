/* eslint-disable react/set-state-in-effect -- MapLibre instance lifecycle is external-system sync by design */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Vite must bundle the worker through its worker pipeline (?worker&url),
// otherwise the worker fails on its first import and no tiles load.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { TANA } from '../lib/location';
import { satellite3DStyle } from '../lib/basemaps';
import { DEMO_STOPS, stopsToBoxes } from '../lib/landmarks';
import type { MapProps } from './Map';

maplibregl.setWorkerUrl(workerUrl);

/**
 * 3D satellite view: Esri imagery draped over real elevation (raster-dem terrain).
 * Same props as the Leaflet 2D map so App can toggle between them.
 * Free tiles, no API key.
 */
export default function Map3D({ origin, dest, onChange }: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const originMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  const changeRef = useRef(onChange);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const markReady = useCallback(() => setStatus('ready'), []);
  const markFailed = useCallback((msg: string) => {
    setErrorMsg(msg);
    setStatus('error');
  }, []);

  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let map: maplibregl.Map | null = null;
    try {
      map = new maplibregl.Map({
        container,
        style: satellite3DStyle(),
        center: [TANA.lon, TANA.lat],
        zoom: 13,
        pitch: 45,
        bearing: -17.6,
        canvasContextAttributes: { antialias: true },
      });
    } catch (e) {
      markFailed(e instanceof Error ? e.message : 'map-init-failed (WebGL unavailable?)');
      return;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    // No TerrainControl: terrain is baked into the satellite style (always on)
    // and absent from streets (toggle would point at a missing source).

    map.on('error', (e) => {
      // Surface tile/style failures instead of a silent blank canvas.
      // eslint-disable-next-line no-console
      console.error('[Map3D]', e.error);
      markFailed(e.error instanceof Error ? e.error.message : 'map-error');
    });

    // Fires on initial load. Style never changes now — single satellite style.
    // Markers are DOM overlays and survive anything; nothing runtime to re-add.
    map.on('style.load', () => {
      markReady();
      try {
        // Amber stop pillars — demo data now, live `stops` table later.
        if (map && !map.getSource('taxib-stops')) {
          map.addSource('taxib-stops', { type: 'geojson', data: stopsToBoxes(DEMO_STOPS) });
        }
        if (map && !map.getLayer('taxib-pillars')) {
          map.addLayer({
            id: 'taxib-pillars',
            source: 'taxib-stops',
            type: 'fill-extrusion',
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.9,
            },
          });
        }
        // Urban feel: OSM buildings with a fallback height. Tana footprints
        // rarely carry height tags, so coalesce to 12m — honest boxes, fake heights.
        if (map && !map.getSource('openfreemap')) {
          map.addSource('openfreemap', { type: 'vector', url: 'https://tiles.openfreemap.org/planet' });
        }
        if (map && !map.getLayer('city-boxes')) {
          map.addLayer({
            id: 'city-boxes',
            source: 'openfreemap',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 15,
            filter: ['!=', ['get', 'hide_3d'], true],
            paint: {
              'fill-extrusion-color': '#cbd5e1',
              'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.75,
            },
          });
        }
      } catch (e) {
        // Boxes are decoration — never blank the map over them.
        // eslint-disable-next-line no-console
        console.warn('[Map3D] extrusion layers skipped:', e);
      }
    });

    const onDrag = () => {
      const o = originMarkerRef.current?.getLngLat();
      const d = destMarkerRef.current?.getLngLat();
      if (o && d) changeRef.current({ lat: o.lat, lon: o.lng }, { lat: d.lat, lon: d.lng });
    };

    originMarkerRef.current = new maplibregl.Marker({ draggable: true, color: '#22c55e' })
      .setLngLat([TANA.lon, TANA.lat])
      .addTo(map);
    destMarkerRef.current = new maplibregl.Marker({ draggable: true, color: '#f87171' })
      .setLngLat([TANA.lon, TANA.lat])
      .addTo(map);
    originMarkerRef.current.on('dragend', onDrag);
    destMarkerRef.current.on('dragend', onDrag);

    // The container can mount at 0×0 inside the grid — resize once laid out.
    const ro = new ResizeObserver(() => map?.resize());
    ro.observe(container);
    requestAnimationFrame(() => map?.resize());

    return () => {
      ro.disconnect();
      map?.remove();
      mapRef.current = null;
      originMarkerRef.current = null;
      destMarkerRef.current = null;
    };
  }, [markFailed, markReady]);

  // Keep markers in sync when origin/dest change from outside (GPS, swap, 2D view).
  useEffect(() => {
    originMarkerRef.current?.setLngLat([origin.lon, origin.lat]);
  }, [origin]);
  useEffect(() => {
    destMarkerRef.current?.setLngLat([dest.lon, dest.lat]);
  }, [dest]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-stone-400">
          Loading 3D tiles…
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-x-4 top-4 rounded-xl border border-red-400/40 bg-stone-900/95 p-3 text-[13px] text-red-300">
          3D failed to load{errorMsg ? `: ${errorMsg}` : ''}. Switch back to 2D or check the console.
        </div>
      )}
    </div>
  );
}
