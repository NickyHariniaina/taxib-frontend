/* eslint-disable react/set-state-in-effect -- endpoint-driven async fetching syncs external data */
import { useEffect, useState } from 'react';
import Map from './components/Map';
import SearchField from './components/SearchField';
import StopList from './components/StopList';
import JourneyOptions from './components/JourneyOptions';
import { getCurrentPosition, type LatLon } from './lib/location';
import type { Place } from './lib/geocode';
import { findNearbyStops, type Stop } from './lib/stops';
import { findLinesNear, type BusLine } from './lib/lines';
import { formatTrip, getRoadPath, type RoadPath } from './lib/directions';

const coordsLabel = (p: LatLon) => `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
const keyOf = (p: LatLon | null) => (p ? `${p.lat},${p.lon}` : 'unset');

export default function App() {
  // No defaults: the user sets each endpoint via search, GPS, or map tap.
  const [origin, setOrigin] = useState<LatLon | null>(null);
  const [dest, setDest] = useState<LatLon | null>(null);
  const [originLabel, setOriginLabel] = useState('');
  const [destLabel, setDestLabel] = useState('');
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Escape closes the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Spike: live OSM stops + lines around each set endpoint. Debounced + aborted;
  // the future backend endpoints keep this exact UI.
  useEffect(() => {
    setStopsError(null);
    setLinesError(null);
    if (!origin && !dest) {
      setOriginStops([]);
      setDestStops([]);
      setOriginLines([]);
      setDestLines([]);
      setStopsLoading(false);
      setLinesLoading(false);
      return;
    }
    setStopsLoading(true);
    setLinesLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const [o, d, lo, ld] = await Promise.all([
          origin ? findNearbyStops(origin, { signal: ctrl.signal }) : Promise.resolve([]),
          dest ? findNearbyStops(dest, { signal: ctrl.signal }) : Promise.resolve([]),
          origin ? findLinesNear(origin, { signal: ctrl.signal }) : Promise.resolve([]),
          dest ? findLinesNear(dest, { signal: ctrl.signal }) : Promise.resolve([]),
        ]);
        setOriginStops(o);
        setDestStops(d);
        setOriginLines(lo);
        setDestLines(ld);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setStopsError('Could not load nearby stops. Check connection.');
        setLinesError('Could not load nearby lines. Check connection.');
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
  }, [keyOf(origin), keyOf(dest)]);

  // Road path needs both endpoints; lives alone so slow Overpass calls
  // never block or blank the route line.
  useEffect(() => {
    if (!origin || !dest) {
      setRoad(null);
      setRoadError(null);
      setRoadLoading(false);
      return;
    }
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
            : 'Road path unavailable. Check connection.',
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
  }, [keyOf(origin), keyOf(dest)]);

  const useGps = async () => {
    try {
      setError(null);
      setLocating(true);
      const p = await getCurrentPosition();
      setOrigin(p);
      setOriginLabel('Current location');
      setFocus(p);
      setDrawerOpen(false);
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
    setDrawerOpen(false);
  };

  const pickDest = (p: Place) => {
    const ll = { lat: p.lat, lon: p.lon };
    setDest(ll);
    setDestLabel(p.name);
    setFocus(ll);
    setDrawerOpen(false);
  };

  /** Tap on empty map: fills origin first, then destination. */
  const mapTap = (p: LatLon) => {
    if (!origin) {
      setOrigin(p);
      setOriginLabel(coordsLabel(p));
    } else {
      setDest(p);
      setDestLabel(coordsLabel(p));
    }
  };

  const tripReady = origin !== null && dest !== null;

  return (
    <div className="relative h-svh overflow-hidden bg-stone-950 text-stone-100 overscroll-none">
      {/* map owns the screen */}
      <div className="absolute inset-0">
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
            if (o) setOriginLabel(coordsLabel(o));
            if (d) setDestLabel(coordsLabel(d));
          }}
          onMapClick={mapTap}
        />
      </div>

      {/* floating top bar: hamburger + trip at a glance + locate */}
      <header className="absolute inset-x-3 top-3 z-[1100] flex items-center gap-2 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => setDrawerOpen((v) => !v)}
          aria-expanded={drawerOpen}
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-stone-900/90 shadow-2xl backdrop-blur active:scale-95"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-white transition-all duration-300 ${
                drawerOpen ? 'top-1/2 -translate-y-1/2 rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded bg-white transition-all duration-300 ${
                drawerOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`absolute bottom-0 left-0 h-0.5 w-5 rounded bg-white transition-all duration-300 ${
                drawerOpen ? 'bottom-1/2 translate-y-1/2 -rotate-45' : ''
              }`}
            />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-white/10 bg-stone-900/90 px-3 py-2 text-left shadow-2xl backdrop-blur active:scale-[0.99]"
        >
          <img src="/logo.png" alt="taxib logo" className="h-8 w-8 shrink-0 rounded-lg" width={32} height={32} />
          <span className="min-w-0 flex-1 truncate text-sm">
            {originLabel || destLabel ? (
              <>
                <span className="font-semibold text-white">{originLabel || 'Where from?'}</span>
                <span className="text-stone-400"> → {destLabel || 'Where to?'}</span>
              </>
            ) : (
              <span className="text-stone-400">Where in Tana are you going?</span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={useGps}
          disabled={locating}
          title="Use GPS for origin"
          aria-label="Use GPS for origin"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-stone-900/90 text-lg shadow-2xl backdrop-blur active:scale-95 disabled:opacity-60"
        >
          {locating ? '…' : '◎'}
        </button>
      </header>

      {/* backdrop */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
        className={`absolute inset-0 z-[1200] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* drawer */}
      <aside
        className={`absolute top-0 bottom-0 left-0 z-[1300] flex w-[86vw] max-w-[380px] flex-col gap-4 overflow-y-auto border-r border-white/10 bg-stone-900/95 p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="taxib logo"
            className="h-11 w-11 rounded-xl shadow-xl"
            width={44}
            height={44}
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">taxib</h1>
            <p className="text-xs text-stone-400">Bus routes · Antananarivo</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-stone-300 ring-1 ring-white/10 active:scale-95"
          >
            ✕
          </button>
        </div>

        <SearchField
          label="Origin"
          placeholder="Search a place in Tana…"
          value={originLabel}
          onPick={pickOrigin}
          onClear={() => {
            setOrigin(null);
            setOriginLabel('');
          }}
        />
        {origin && <p className="-mt-2 font-mono text-[11px] text-stone-500">{coordsLabel(origin)}</p>}

        <SearchField
          label="Destination"
          placeholder="Where to?"
          value={destLabel}
          onPick={pickDest}
          onClear={() => {
            setDest(null);
            setDestLabel('');
          }}
        />
        {dest && <p className="-mt-2 font-mono text-[11px] text-stone-500">{coordsLabel(dest)}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={useGps}
            disabled={locating}
            className="flex-1 rounded-xl bg-gradient-to-br from-[#FC3D32] to-[#c22a22] px-4 py-3 text-sm font-extrabold text-white shadow-xl disabled:opacity-60"
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
            className="rounded-xl bg-white/5 px-4 ring-1 ring-white/10 hover:ring-[#FC3D32]"
          >
            ⇅
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-[13px] text-red-300">
            {error}
          </div>
        )}

        {tripReady &&
          (roadLoading ? (
            <div className="h-11 animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10" />
          ) : road ? (
            <div className="rounded-xl bg-gradient-to-br from-[#FC3D32] to-[#c22a22] px-4 py-2.5 text-center text-sm font-extrabold text-white shadow-xl">
              {formatTrip(road.distanceM, road.durationS)}
            </div>
          ) : (
            roadError && <p className="text-center text-xs text-stone-500">{roadError}</p>
          ))}

        {linesError && (
          <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-[13px] text-red-300">
            {linesError}
          </div>
        )}

        {tripReady ? (
          <JourneyOptions originLines={originLines} destLines={destLines} loading={linesLoading} />
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[13px] text-stone-400">
            Set an origin and a destination to see buses.
          </div>
        )}

        {stopsError && (
          <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-[13px] text-red-300">
            {stopsError}
          </div>
        )}

        <StopList
          title="Stops near origin"
          stops={originStops}
          loading={stopsLoading && origin !== null}
          onSelect={(s) => setFocus({ lat: s.lat, lon: s.lon })}
        />
        <StopList
          title="Stops near destination"
          stops={destStops}
          loading={stopsLoading && dest !== null}
          onSelect={(s) => setFocus({ lat: s.lat, lon: s.lon })}
        />

        <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[13px] text-stone-400">
          Search, use GPS, or tap the map: first tap sets origin, next taps set destination. Drag
          markers to fine-tune.
        </div>
      </aside>

      {/* map hint */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-[1000] max-w-[92vw] -translate-x-1/2 truncate rounded-full border border-white/10 bg-stone-900/90 px-4 py-1.5 text-xs whitespace-nowrap text-stone-400 backdrop-blur">
        <span className="hidden sm:inline">Tap map to set points · drag markers · scroll to zoom</span>
        <span className="sm:hidden">Tap to set points · drag to move</span>
      </div>
    </div>
  );
}
