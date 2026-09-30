import { useMemo } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';
import { TANA, type LatLon } from '../lib/location';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite breaks Leaflet's default icon URLs — restore them explicitly.
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export type MapProps = {
  origin: LatLon;
  dest: LatLon;
  onChange: (origin: LatLon, dest: LatLon) => void;
};

export default function Map({ origin, dest, onChange }: MapProps) {
  const center = useMemo<LatLngExpression>(() => [TANA.lat, TANA.lon], []);
  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        draggable
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
