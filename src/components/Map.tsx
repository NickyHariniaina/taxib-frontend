import { useEffect, useMemo, useRef } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { Stop } from '../lib/stops';
import type { Neighborhood, NeighborhoodStop } from '../lib/neighborhoods';
import { useAppearance } from '../lib/useAppearance';
import { useFormatter, useTranslations } from '../i18n';
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
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
  className: 'cursor-pointer',
});

// Reuse one instance for both markers (same artwork, cheaper DOM).
const destIcon = originIcon;

/** Escapes text interpolated into the inline SVG of a div icon. */
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] ?? char,
  );

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
  quartierStops: NeighborhoodStop[];
  /** True once the selected quartier's stops resolved (empty or not). */
  quartierStopsLoaded: boolean;
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
 * Bus-stop badge: a rounded square in the accent colour with a solid bus
 * glyph. Solid shapes, not hairlines — at 30px a thin path turns to mush.
 */
function makeStopIcon(color: string, name: string): L.DivIcon {
  return L.divIcon({
    className: 'quartier-stop-icon',
    html: `<svg viewBox="0 0 30 30" width="30" height="30" role="img" aria-label="${escapeHtml(name)}"><rect x="1" y="1" width="28" height="28" rx="8" fill="${color}" stroke="white" stroke-width="2"/><rect x="10" y="7.5" width="10" height="12" rx="2" fill="white"/><rect x="11.5" y="9" width="7" height="4" rx="1" fill="${color}"/><circle cx="12.5" cy="20.5" r="1.7" fill="white"/><circle cx="17.5" cy="20.5" r="1.7" fill="white"/></svg>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/** Frames the selected quartier: fits its stops, or zooms to its centre. */
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
      map.flyToBounds(
        points.map((p) => [p.lat, p.lon] as [number, number]),
        { padding: [48, 48], maxZoom: 17, duration: 1.2 },
      );
    } else {
      map.flyTo([center.lat, center.lon], 15, { duration: 1.2 });
    }
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
  // One icon per stop: the glyph carries the stop name for screen readers.
  const stopIcons = useMemo(
    () =>
      quartierStops.map((s) => ({
        stop: s,
        icon: makeStopIcon(accentColor, s.name),
      })),
    [quartierStops, accentColor],
  );
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
      {path && path.length > 1 && (
        <Polyline
          positions={path.map((p) => [p.lat, p.lon] as [number, number])}
          pathOptions={{ color: accentColor, weight: 7, opacity: 0.9 }}
        />
      )}
      {originStops.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lon]}
          radius={6}
          pathOptions={{ color: '#22c55e', weight: 2, fillColor: '#22c55e', fillOpacity: 0.7 }}
          eventHandlers={{ click: stopMapClick }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {s.name ?? t('unnamed')} ·{' '}
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
          radius={6}
          pathOptions={{ color: '#38bdf8', weight: 2, fillColor: '#38bdf8', fillOpacity: 0.7 }}
          eventHandlers={{ click: stopMapClick }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {s.name ?? t('unnamed')} ·{' '}
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
        />
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
        />
      )}
      {stopIcons.map(({ stop, icon }) => (
        <Marker
          key={stop.id}
          icon={icon}
          position={[stop.lat, stop.lon]}
        >
          <Tooltip direction="top" offset={[0, -14]}>
            {stop.name}
          </Tooltip>
        </Marker>
      ))}
      {selectedNeighborhood && (
        <CircleMarker
          className="cursor-pointer"
          center={[
            selectedNeighborhood.latitude,
            selectedNeighborhood.longitude,
          ]}
          radius={12}
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
