import { useState } from 'react';
import Map, { TANA } from './components/Map';
import { getCurrentPosition, type LatLon } from './lib/location';
import './App.css';

export default function App() {
  const [origin, setOrigin] = useState<LatLon>(TANA);
  const [dest, setDest] = useState<LatLon>({ lat: -18.91, lon: 47.52 });
  const [error, setError] = useState<string | null>(null);

  const useGps = async () => {
    try {
      setError(null);
      setOrigin(await getCurrentPosition());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'location-unavailable');
    }
  };

  return (
    <div className="app">
      <header className="bar">
        <strong>TaxiB</strong>
        <span>
          {origin.lat.toFixed(5)},{origin.lon.toFixed(5)} → {dest.lat.toFixed(5)},{dest.lon.toFixed(5)}
        </span>
        <button type="button" onClick={useGps}>
          Use GPS for origin
        </button>
      </header>
      {error && <div className="error">{error}</div>}
      <main className="map">
        <Map origin={origin} dest={dest} onChange={(o, d) => { setOrigin(o); setDest(d); }} />
      </main>
    </div>
  );
}
