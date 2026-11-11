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
import type { Neighborhood } from '../lib/neighborhoods';
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

export default function Map({
  origin,
  dest,
  focus,
  originStops,
  destStops,
  path,
  selectedNeighborhood,
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
