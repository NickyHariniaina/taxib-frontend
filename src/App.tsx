import { useState } from 'react';
import Map from './components/Map';
import { TANA, getCurrentPosition, type LatLon } from './lib/location';

export default function App() {
  const [origin, setOrigin] = useState<LatLon>(TANA);
  const [dest, setDest] = useState<LatLon>({ lat: -18.91, lon: 47.52 });
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const useGps = async () => {
    try {
      setError(null);
      setLocating(true);
      setOrigin(await getCurrentPosition());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'location-unavailable');
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="grid h-svh bg-stone-950 text-stone-100 md:grid-cols-[380px_1fr] grid-rows-[auto_1fr] md:grid-rows-1">
      {/* side panel */}
      <aside className="z-[1000] flex flex-col gap-4 overflow-y-auto border-b border-white/10 bg-stone-900/95 p-5 backdrop-blur max-md:max-h-[42svh] md:border-b-0 md:border-r">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-xl font-black text-stone-950 shadow-xl">
            T
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TaxiB</h1>
            <p className="text-xs text-stone-400">Bus routes · Antananarivo</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Origin</p>
            <p className="mt-1 font-mono text-xs">
              {origin.lat.toFixed(5)}, {origin.lon.toFixed(5)}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Destination</p>
            <p className="mt-1 font-mono text-xs">
              {dest.lat.toFixed(5)}, {dest.lon.toFixed(5)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={useGps}
              disabled={locating}
              className="flex-1 rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 px-4 py-3 text-sm font-extrabold text-stone-950 shadow-xl disabled:opacity-60"
            >
              {locating ? 'Locating…' : 'Use GPS for origin'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOrigin(dest);
                setDest(origin);
              }}
              title="Swap origin and destination"
              className="rounded-xl bg-white/5 px-4 ring-1 ring-white/10 hover:ring-amber-300"
            >
              ⇅
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-[13px] text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[13px] text-stone-400">
          Drag either marker on the map to fine-tune your trip endpoints.
        </div>
      </aside>

      {/* map */}
      <main className="relative min-h-0">
        <Map
          origin={origin}
          dest={dest}
          onChange={(o, d) => {
            setOrigin(o);
            setDest(d);
          }}
        />
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-stone-900/90 px-4 py-1.5 text-xs whitespace-nowrap text-stone-400 backdrop-blur">
          Drag markers · scroll to zoom
        </div>
      </main>
    </div>
  );
}
