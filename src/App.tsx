/* eslint-disable react/set-state-in-effect -- endpoint-driven async stop fetching syncs external data */
import { useEffect, useState } from 'react';
import Map from './components/Map';
import SearchField from './components/SearchField';
import StopList from './components/StopList';
import JourneyOptions from './components/JourneyOptions';
import { TANA, getCurrentPosition, type LatLon } from './lib/location';
import type { Place } from './lib/geocode';
import { findNearbyStops, type Stop } from './lib/stops';
import { findLinesNear, type BusLine } from './lib/lines';
import { formatTrip, getRoadPath, type RoadPath } from './lib/directions';

const DEFAULT_DEST: LatLon = { lat: -18.91, lon: 47.52 };

const coordsLabel = (p: LatLon) => `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;

export default function App() {
  const [origin, setOrigin] = useState<LatLon>(TANA);
  const [dest, setDest] = useState<LatLon>(DEFAULT_DEST);
  const [originLabel, setOriginLabel] = useState('Tana center');
  const [destLabel, setDestLabel] = useState(coordsLabel(DEFAULT_DEST));
  const [focus, setFocus] = useState<LatLon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [originStops, setOriginStops] = useState<Stop[]>([]);
  const [destStops, setDestStops] = useState<Stop[]>([]);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [stopsError, setStopsError] = useState<string | null>(null);
  const [originLines, setOriginLines] = useState<BusLine[]>([]);
  const [destLines, setDestLines] = useState<BusLine[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [road, setRoad] = useState<RoadPath | null>(null);
  const [roadLoading, setRoadLoading] = useState(false);
  const [roadError, setRoadError] = useState<string | null>(null);

  // Spike: live OSM stops + lines around both endpoints. Debounced + aborted;
  // the future backend endpoints keep this exact UI.
  useEffect(() => {
    setStopsLoading(true);
    setStopsError(null);
    setLinesLoading(true);
    setLinesError(null);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const [o, d, lo, ld] = await Promise.all([
          findNearbyStops(origin, { signal: ctrl.signal }),
          findNearbyStops(dest, { signal: ctrl.signal }),
          findLinesNear(origin, { signal: ctrl.signal }),
          findLinesNear(dest, { signal: ctrl.signal }),
        ]);
        setOriginStops(o);
        setDestStops(d);
        setOriginLines(lo);
        setDestLines(ld);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setStopsError('Could not load nearby stops — check connection.');
        setLinesError('Could not load nearby lines — check connection.');
      } finally {
        setStopsLoading(false);
        setLinesLoading(false);
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [`${origin.lat},${origin.lon}`, `${dest.lat},${dest.lon}`]);

  // Road path lives in its own effect: slow/flaky Overpass calls must never
  // block or blank the route line (that was the "nothing is drawn" bug).
  useEffect(() => {
    setRoadLoading(true);
    setRoadError(null);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setRoad(await getRoadPath(origin, dest, { signal: ctrl.signal }));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setRoad(null);
        setRoadError(
          e instanceof Error && e.message === 'route-not-found'
            ? 'No road connects these two points.'
            : 'Road path unavailable — check connection.',
        );
      } finally {
        setRoadLoading(false);
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [`${origin.lat},${origin.lon}`, `${dest.lat},${dest.lon}`]);

  const useGps = async () => {
    try {
      setError(null);
      setLocating(true);
      const p = await getCurrentPosition();
      setOrigin(p);
      setOriginLabel('Current location');
      setFocus(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'location-unavailable');
    } finally {
      setLocating(false);
    }
  };

  const pickOrigin = (p: Place) => {
    const ll = { lat: p.lat, lon: p.lon };
    setOrigin(ll);
    setOriginLabel(p.name);
    setFocus(ll);
  };

  const pickDest = (p: Place) => {
    const ll = { lat: p.lat, lon: p.lon };
    setDest(ll);
    setDestLabel(p.name);
    setFocus(ll);
  };

  return (
    <div className="grid h-svh bg-stone-950 text-stone-100 md:grid-cols-[380px_1fr] grid-rows-[auto_1fr] md:grid-rows-1">
      {/* side panel */}
      <aside className="z-[1000] flex flex-col gap-4 overflow-y-auto border-b border-white/10 bg-stone-900/95 p-5 backdrop-blur max-md:max-h-[52svh] md:border-b-0 md:border-r">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="taxib logo"
            className="h-11 w-11 rounded-xl shadow-xl"
            width={44}
            height={44}
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight">taxib</h1>
            <p className="text-xs text-stone-400">Bus routes · Antananarivo</p>
          </div>
        </div>

        <SearchField
          label="Origin"
          placeholder="Search a place in Tana…"
          value={originLabel}
          onPick={pickOrigin}
          onClear={() => {
            setOrigin(TANA);
            setOriginLabel('Tana center');
          }}
        />
        <p className="-mt-2 font-mono text-[11px] text-stone-500">{coordsLabel(origin)}</p>

        <SearchField
          label="Destination"
          placeholder="Where to?"
          value={destLabel}
          onPick={pickDest}
          onClear={() => {
            setDest(DEFAULT_DEST);
            setDestLabel(coordsLabel(DEFAULT_DEST));
          }}
        />
        <p className="-mt-2 font-mono text-[11px] text-stone-500">{coordsLabel(dest)}</p>

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
              setOriginLabel(destLabel);
              setDestLabel(originLabel);
            }}
            title="Swap origin and destination"
            className="rounded-xl bg-white/5 px-4 ring-1 ring-white/10 hover:ring-amber-300"
          >
            ⇅
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-[13px] text-red-300">
            {error}
          </div>
        )}

        {stopsError && (
          <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-[13px] text-red-300">
            {stopsError}
          </div>
        )}

        {linesError && (
          <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-[13px] text-red-300">
            {linesError}
          </div>
        )}

        {roadLoading ? (
          <div className="h-11 animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10" />
        ) : road ? (
          <div className="rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 px-4 py-2.5 text-center text-sm font-extrabold text-stone-950 shadow-xl">
            {formatTrip(road.distanceM, road.durationS)}
          </div>
        ) : (
          roadError && <p className="text-center text-xs text-stone-500">{roadError}</p>
        )}

        <JourneyOptions originLines={originLines} destLines={destLines} loading={linesLoading} />

        <StopList
          title="Stops near origin"
          stops={originStops}
          loading={stopsLoading}
          onSelect={(s) => setFocus({ lat: s.lat, lon: s.lon })}
        />
        <StopList
          title="Stops near destination"
          stops={destStops}
          loading={stopsLoading}
          onSelect={(s) => setFocus({ lat: s.lat, lon: s.lon })}
        />

        <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[13px] text-stone-400">
          Search, use GPS, or drag either marker to fine-tune your trip endpoints.
        </div>
      </aside>

      {/* map */}
      <main className="relative min-h-0">
        <Map
          origin={origin}
          dest={dest}
          focus={focus}
          originStops={originStops}
          destStops={destStops}
          path={road?.path ?? null}
          onChange={(o, d) => {
            setOrigin(o);
            setDest(d);
            setOriginLabel(coordsLabel(o));
            setDestLabel(coordsLabel(d));
          }}
        />
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-stone-900/90 px-4 py-1.5 text-xs whitespace-nowrap text-stone-400 backdrop-blur">
          Drag markers · scroll to zoom
        </div>
      </main>
    </div>
  );
}
