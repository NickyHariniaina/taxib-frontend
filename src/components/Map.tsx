import { useEffect, useMemo, useRef } from 'react';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { MapStop, Stop } from '../lib/stops';
import type { Neighborhood } from '../lib/neighborhoods';
import { useAppearance } from '../lib/useAppearance';
import { useFormatter, useTranslations } from '../i18n';
import StopBadges, { type TappableStop } from './StopBadges';
import L, { type LatLngExpression, type LeafletMouseEvent } from 'leaflet';
import { TANA, type LatLon } from '../lib/location';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite breaks Leaflet's default icon URLs, and Icon.Default mangles
// replacement URLs by prepending its detected image path, so use explicit
// icons instead of mutating the default.
const originIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [32, 52],
  iconAnchor: [16, 52],
  shadowSize: [52, 52],
  className: 'cursor-pointer',
});

// Reuse one instance for both markers (same artwork, cheaper DOM).
const destIcon = originIcon;

/** Crosshair marking the centre of a stop-search zone. */
const zonePinIcon = L.divIcon({
  className: 'zone-pin-icon',
  html: '<svg viewBox="0 0 30 30" width="34" height="34" aria-hidden="true"><circle cx="15" cy="15" r="11" fill="none" stroke="white" stroke-width="2.5"/><circle cx="15" cy="15" r="4" fill="white"/></svg>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export type MapProps = {
  origin: LatLon | null;
  dest: LatLon | null;
  /** When set, glide the camera here (search pick). Consumed once per change. */
  focus: LatLon | null;
  originStops: Stop[];
  destStops: Stop[];
  /** Ordered road geometry, drawn under the markers. Null = not loaded. */
  path: LatLon[] | null;
  /** Currently selected quartier, shown on the map. */
  selectedNeighborhood: Neighborhood | null;
  /** Stops of the selected quartier, drawn as bus-stop icons. */
  quartierStops: MapStop[];
  /** True once the selected quartier's stops resolved (empty or not). */
  quartierStopsLoaded: boolean;
  /** Centre and radius of the stop-search zone. Null = no zone. */
  zone: { center: LatLon; radiusM: number } | null;
  /** Stops inside the zone, drawn as bus-stop icons. */
  zoneStops: MapStop[];
  /** Stops of the selected line, drawn as bus-stop icons. */
  lineStops: MapStop[];
  /** Called when a stop badge is tapped. */
  onStopSelect?: (stop: TappableStop) => void;
  /** Removes the selected quartier mark. */
  onClearNeighborhood: () => void;
  /** Removes the start (origin) pin. */
  onClearOrigin: () => void;
  /** Removes the end (destination) pin. */
  onClearDest: () => void;
  onChange: (origin: LatLon | null, dest: LatLon | null) => void;
  /** Tap on empty map: sets origin if unset, else destination. */
  onMapClick: (point: LatLon) => void;
};

/** Glides to `focus` whenever it changes to a new point. */
function FlyTo({ focus }: { focus: LatLon | null }) {
  const map = useMap();
  const key = focus ? `${focus.lat},${focus.lon}` : '';
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lon], 15, { duration: 1.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/** Tap on empty map (not on a marker) sets the next unset endpoint. */
function ClickSetter({ onMapClick }: { onMapClick: (point: LatLon) => void }) {
  useMapEvents({
    click: (e) => onMapClick({ lat: e.latlng.lat, lon: e.latlng.lng }),
  });
  return null;
}

/**
 * Circle markers are Leaflet paths, and paths bubble clicks to the map. Without
 * this guard a tap on a stop would also set an endpoint.
 */
function stopMapClick(e: LeafletMouseEvent) {
  L.DomEvent.stopPropagation(e.originalEvent);
}

/**
 * Frames the selected quartier: fits its stops, or zooms to its centre.
 *
 * The zoom is computed by hand and rounded up: fitBounds rounds down, which
 * leaves the stops noticeably small on a phone.
 */
function FitQuartier({
  center,
  points,
  loaded,
}: {
  center: LatLon;
  points: LatLon[];
  loaded: boolean;
}) {
  const map = useMap();
  const key = `${center.lat},${center.lon}|${points.length}|${loaded}`;
  useEffect(() => {
    if (!loaded) return;
    if (points.length > 0) {
      const bounds = L.latLngBounds(
        points.map((p) => [p.lat, p.lon] as [number, number]),
      );
      const zoom = Math.min(
        18,
        Math.ceil(map.getBoundsZoom(bounds, false, L.point(32, 32))),
      );
      map.flyTo(bounds.getCenter(), zoom, { duration: 1.2 });
    } else {
      map.flyTo([center.lat, center.lon], 16, { duration: 1.2 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/**
 * Frames the search zone: the camera fits the circle, not the point. The zoom
 * comes from the radius and the viewport, so the zone fills the screen
 * whatever its size.
 */
function FitZone({ center, radiusM }: { center: LatLon; radiusM: number }) {
  const map = useMap();
  const key = `${center.lat},${center.lon}|${radiusM}`;
  useEffect(() => {
    const size = map.getSize();
    const span = Math.max(Math.min(size.x, size.y) - 48, 50);
    // Metres per pixel at zoom 0 for this latitude (Web Mercator).
    const mpp = (radiusM * 2) / span;
    const zoom = Math.min(
      18,
      Math.log2((156543.03 * Math.cos((center.lat * Math.PI) / 180)) / mpp),
    );
    map.flyTo([center.lat, center.lon], zoom, { duration: 1.2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function Map({
  origin,
  dest,
  focus,
  originStops,
  destStops,
  path,
  selectedNeighborhood,
  quartierStops,
  quartierStopsLoaded,
  zone,
  zoneStops,
  lineStops,
  onStopSelect,
  onClearNeighborhood,
  onClearOrigin,
  onClearDest,
  onChange,
  onMapClick,
}: MapProps) {
  const { accentColor } = useAppearance();
  const t = useTranslations('Stops');
  const tApp = useTranslations('App');
  const format = useFormatter();
  // Leaflet can fire a click right after a drag: swallow it so nudging a pin
  // repositions it instead of deleting it.
  const dragged = useRef(false);
  const markDragged = () => {
    dragged.current = true;
    setTimeout(() => {
      dragged.current = false;
    }, 250);
  };
  const consumeDrag = () => {
    if (!dragged.current) return false;
    dragged.current = false;
    return true;
  };
  const center = useMemo<LatLngExpression>(() => [TANA.lat, TANA.lon], []);
  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo focus={focus} />
      {selectedNeighborhood && (
        <FitQuartier
          center={{
            lat: selectedNeighborhood.latitude,
            lon: selectedNeighborhood.longitude,
          }}
          points={quartierStops.map((s) => ({ lat: s.lat, lon: s.lon }))}
          loaded={quartierStopsLoaded}
        />
      )}
      <ClickSetter onMapClick={onMapClick} />
      {zone && (
        <FitZone center={zone.center} radiusM={zone.radiusM} />
      )}
      {path && path.length > 1 && (
        <Polyline
          positions={path.map((p) => [p.lat, p.lon] as [number, number])}
          pathOptions={{ color: accentColor, weight: 7, opacity: 0.9 }}
        />
      )}
      {zone && (
        <Circle
          center={[zone.center.lat, zone.center.lon]}
          radius={zone.radiusM}
          pathOptions={{
            color: accentColor,
            weight: 1.5,
            dashArray: '5 6',
            fillColor: accentColor,
            fillOpacity: 0.07,
          }}
          eventHandlers={{ click: stopMapClick }}
        />
      )}
      {zone && (
        <Marker
          icon={zonePinIcon}
          position={[zone.center.lat, zone.center.lon]}
          interactive={false}
        />
      )}
      {originStops.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lon]}
          radius={8}
          pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: '#22c55e', fillOpacity: 0.95 }}
          eventHandlers={{ click: stopMapClick }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {s.name || t('unnamed')} ·{' '}
            {format.number(s.distanceM, {
              style: 'unit',
              unit: 'meter',
              unitDisplay: 'short',
              maximumFractionDigits: 0,
            })}
          </Tooltip>
        </CircleMarker>
      ))}
      {destStops.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lon]}
          radius={8}
          pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: '#38bdf8', fillOpacity: 0.95 }}
          eventHandlers={{ click: stopMapClick }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {s.name || t('unnamed')} ·{' '}
            {format.number(s.distanceM, {
              style: 'unit',
              unit: 'meter',
              unitDisplay: 'short',
              maximumFractionDigits: 0,
            })}
          </Tooltip>
        </CircleMarker>
      ))}
      {origin && (
        <Marker
          draggable
          icon={originIcon}
          position={[origin.lat, origin.lon]}
          title={tApp('removeOrigin')}
          eventHandlers={{
            dragend: (e) => {
              markDragged();
              const m = e.target.getLatLng();
              onChange({ lat: m.lat, lon: m.lng }, dest);
            },
            click: () => {
              if (consumeDrag()) return;
              onClearOrigin();
            },
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -6]}>
            {tApp('pinOrigin')}
          </Tooltip>
        </Marker>
      )}
      {dest && (
        <Marker
          draggable
          icon={destIcon}
          position={[dest.lat, dest.lon]}
          title={tApp('removeDest')}
          eventHandlers={{
            dragend: (e) => {
              markDragged();
              const m = e.target.getLatLng();
              onChange(origin, { lat: m.lat, lon: m.lng });
            },
            click: () => {
              if (consumeDrag()) return;
              onClearDest();
            },
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -6]}>
            {tApp('pinDest')}
          </Tooltip>
        </Marker>
      )}
      <StopBadges stops={quartierStops} onSelect={onStopSelect} />
      <StopBadges stops={zoneStops} onSelect={onStopSelect} />
      <StopBadges stops={lineStops} onSelect={onStopSelect} />
      {selectedNeighborhood && (
        <CircleMarker
          className="cursor-pointer"
          center={[
            selectedNeighborhood.latitude,
            selectedNeighborhood.longitude,
          ]}
          radius={14}
          pathOptions={{
            color: '#FFFFFF',
            weight: 3,
            fillColor: accentColor,
            fillOpacity: 0.9,
          }}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e.originalEvent);
              onClearNeighborhood();
            },
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -16]}>
            {selectedNeighborhood.name}
          </Tooltip>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
