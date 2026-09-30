import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { Stop } from '../lib/stops';
import L, { type LatLngExpression } from 'leaflet';
import { TANA, type LatLon } from '../lib/location';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite breaks Leaflet's default icon URLs, and Icon.Default mangles
// replacement URLs by prepending its detected image path — so use explicit
// icons instead of mutating the default.
const originIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

// Reuse one instance for both markers (same artwork, cheaper DOM).
const destIcon = originIcon;

export type MapProps = {
  origin: LatLon;
  dest: LatLon;
  /** When set, glide the camera here (search pick). Consumed once per change. */
  focus: LatLon | null;
  originStops: Stop[];
  destStops: Stop[];
  /** Ordered road geometry, drawn under the markers. Null = not loaded. */
  path: LatLon[] | null;
  onChange: (origin: LatLon, dest: LatLon) => void;
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

export default function Map({ origin, dest, focus, originStops, destStops, path, onChange }: MapProps) {
  const center = useMemo<LatLngExpression>(() => [TANA.lat, TANA.lon], []);
  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo focus={focus} />
      {path && path.length > 1 && (
        <Polyline
          positions={path.map((p) => [p.lat, p.lon] as [number, number])}
          pathOptions={{ color: '#ef4444', weight: 7, opacity: 0.9 }}
        />
      )}
      {originStops.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lon]}
          radius={6}
          pathOptions={{ color: '#22c55e', weight: 2, fillColor: '#22c55e', fillOpacity: 0.7 }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {s.name} · {s.distanceM}m
          </Tooltip>
        </CircleMarker>
      ))}
      {destStops.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lon]}
          radius={6}
          pathOptions={{ color: '#38bdf8', weight: 2, fillColor: '#38bdf8', fillOpacity: 0.7 }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {s.name} · {s.distanceM}m
          </Tooltip>
        </CircleMarker>
      ))}
      <Marker
        draggable
        icon={originIcon}
        position={[origin.lat, origin.lon]}
        eventHandlers={{
          dragend: (e) => {
            const m = e.target.getLatLng();
            onChange({ lat: m.lat, lon: m.lng }, dest);
          },
        }}
      />
      <Marker
        draggable
        icon={destIcon}
        position={[dest.lat, dest.lon]}
        eventHandlers={{
          dragend: (e) => {
            const m = e.target.getLatLng();
            onChange(origin, { lat: m.lat, lon: m.lng });
          },
        }}
      />
    </MapContainer>
  );
}
