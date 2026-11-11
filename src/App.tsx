/* eslint-disable react/set-state-in-effect -- endpoint-driven async fetching syncs external data */
import { useEffect, useState } from "react";
import Map from "./components/Map";
import SearchField from "./components/SearchField";
import QuartierSearch from "./components/QuartierSearch";
import StopList from "./components/StopList";
import JourneyOptions from "./components/JourneyOptions";
import Tour from "./components/Tour";
import TourPrompt from "./components/TourPrompt";
import { getCurrentPosition, type LatLon } from "./lib/location";
import type { Place } from "./lib/geocode";
import type { Neighborhood } from "./lib/neighborhoods";
import { findNearbyStops, type Stop } from "./lib/stops";
import { findLinesNear, type BusLine } from "./lib/lines";
import { formatTrip, getRoadPath, type RoadPath } from "./lib/directions";
import { hasSeenTour, markTourSeen } from "./lib/tour";

const coordsLabel = (p: LatLon) => `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
const keyOf = (p: LatLon | null) => (p ? `${p.lat},${p.lon}` : "unset");

export default function App() {
    // No defaults: the user sets each endpoint via search, GPS, or map tap.
    const [origin, setOrigin] = useState<LatLon | null>(null);
    const [dest, setDest] = useState<LatLon | null>(null);
    const [originLabel, setOriginLabel] = useState("");
    const [destLabel, setDestLabel] = useState("");
    const [selectedQuartier, setSelectedQuartier] = useState<Neighborhood | null>(
        null,
    );
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
    const [quartierOpen, setQuartierOpen] = useState(false);
    // First visit opens on the welcome prompt; a finished tour is remembered.
    const [tour, setTour] = useState<"idle" | "prompt" | "running">(() =>
        hasSeenTour() ? "idle" : "prompt",
    );

    // Escape closes the drawer, unless a dialog or the tour is on top.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !quartierOpen && tour === "idle")
                setDrawerOpen(false);
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [quartierOpen, tour]);

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
                    origin
                        ? findNearbyStops(origin, { signal: ctrl.signal })
                        : Promise.resolve([]),
                    dest
                        ? findNearbyStops(dest, { signal: ctrl.signal })
                        : Promise.resolve([]),
                    origin
                        ? findLinesNear(origin, { signal: ctrl.signal })
                        : Promise.resolve([]),
                    dest
                        ? findLinesNear(dest, { signal: ctrl.signal })
                        : Promise.resolve([]),
                ]);
                setOriginStops(o);
                setDestStops(d);
                setOriginLines(lo);
                setDestLines(ld);
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError")
                    return;
                setStopsError("Impossible de charger les arrêts à proximité. Vérifiez la connexion.");
                setLinesError("Impossible de charger les lignes à proximité. Vérifiez la connexion.");
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
                setRoad(
                    await getRoadPath(origin, dest, { signal: ctrl.signal }),
                );
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError")
                    return;
                setRoad(null);
                setRoadError(
                    e instanceof Error && e.message === "route-not-found"
                        ? "Aucune route ne relie ces deux points."
                        : "Itinéraire indisponible. Vérifiez la connexion.",
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
            setOriginLabel("Current location");
            setFocus(p);
            setDrawerOpen(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Position indisponible");
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
                    selectedNeighborhood={selectedQuartier}
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
                    data-tour="menu"
                    onClick={() => setDrawerOpen((v) => !v)}
                    aria-expanded={drawerOpen}
                    aria-label={drawerOpen ? "Fermer le menu" : "Ouvrir le menu"}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-stone-900/90 shadow-2xl backdrop-blur active:scale-95"
                >
                    <span className="relative block h-4 w-5">
                        <span
                            className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-white transition-all duration-300 ${
                                drawerOpen
                                    ? "top-1/2 -translate-y-1/2 rotate-45"
                                    : ""
                            }`}
                        />
                        <span
                            className={`absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded bg-white transition-all duration-300 ${
                                drawerOpen ? "opacity-0" : ""
                            }`}
                        />
                        <span
                            className={`absolute bottom-0 left-0 h-0.5 w-5 rounded bg-white transition-all duration-300 ${
                                drawerOpen
                                    ? "bottom-1/2 translate-y-1/2 -rotate-45"
                                    : ""
                            }`}
                        />
                    </span>
                </button>
                <button
                    type="button"
                    data-tour="trip"
                    onClick={() => setDrawerOpen(true)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-white/10 bg-stone-900/90 px-3 py-2 text-left shadow-2xl backdrop-blur active:scale-[0.99]"
                >
                    <img
                        src="/logo.png"
                        alt="taxib logo"
                        className="h-8 w-8 shrink-0 rounded-lg"
                        width={32}
                        height={32}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                        {originLabel || destLabel ? (
                                <>
                                    <span className="font-semibold text-white">
                                        {originLabel || "Départ"}
                                    </span>
                                    <span className="text-stone-400">
                                        {" "}
                                        → {destLabel || "Arrivée"}
                                    </span>
                                </>
                        ) : (
                                <span className="text-stone-400">
                                    Où allez-vous ?
                                </span>
                        )}
                    </span>
                </button>
                <button
                    type="button"
                    data-tour="gps"
                    onClick={useGps}
                    disabled={locating}
                    title="Utiliser le GPS"
                    aria-label="Utiliser le GPS"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-stone-900/90 text-lg shadow-2xl backdrop-blur active:scale-95 disabled:opacity-60"
                >
                    {locating ? "…" : "◎"}
                </button>
            </header>

            {/* backdrop */}
            <div
                onClick={() => setDrawerOpen(false)}
                aria-hidden={!drawerOpen}
                className={`absolute inset-0 z-[1200] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
                    drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
            />

            {/* drawer */}
            <aside
                className={`absolute top-0 bottom-0 left-0 z-[1300] flex w-[86vw] max-w-[380px] flex-col gap-4 overflow-y-auto border-r border-white/10 bg-stone-900/95 p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    drawerOpen ? "translate-x-0" : "-translate-x-full"
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
                        <h1 className="text-xl font-bold tracking-tight">
                            taxib
                        </h1>
                        <p className="text-xs text-stone-400">
                            Lignes de bus · Antananarivo
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(false)}
                        aria-label="Fermer le menu"
                        className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-stone-300 ring-1 ring-white/10 active:scale-95"
                    >
                        ✕
                    </button>
                </div>

                <SearchField
                    label="Départ"
                    placeholder="Chercher un lieu à Tana…"
                    value={originLabel}
                    onPick={pickOrigin}
                    onClear={() => {
                        setOrigin(null);
                        setOriginLabel("");
                    }}
                />
                {origin && (
                    <p className="-mt-2 font-mono text-[11px] text-stone-500">
                        {coordsLabel(origin)}
                    </p>
                )}

                <SearchField
                    label="Arrivée"
                    placeholder="Vers où ?"
                    value={destLabel}
                    onPick={pickDest}
                    onClear={() => {
                        setDest(null);
                        setDestLabel("");
                    }}
                />
                {dest && (
                    <p className="-mt-2 font-mono text-[11px] text-stone-500">
                        {coordsLabel(dest)}
                    </p>
                )}

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={useGps}
                        disabled={locating}
                        className="flex-1 rounded-xl bg-gradient-to-br from-[#FC3D32] to-[#c22a22] px-4 py-3 text-sm font-extrabold text-white shadow-xl disabled:opacity-60"
                    >
                        {locating ? "Localisation…" : "Utiliser le GPS"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setOrigin(dest);
                            setDest(origin);
                            setOriginLabel(destLabel);
                            setDestLabel(originLabel);
                        }}
                        title="Échanger origine et destination"
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
                            {formatTrip(road.distanceM)}
                        </div>
                    ) : (
                        roadError && (
                            <p className="text-center text-xs text-stone-500">
                                {roadError}
                            </p>
                        )
                    ))}

                {linesError && (
                    <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-[13px] text-red-300">
                        {linesError}
                    </div>
                )}

                {tripReady ? (
                    <JourneyOptions
                        originLines={originLines}
                        destLines={destLines}
                        loading={linesLoading}
                    />
                ) : (
                    <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[13px] text-stone-400">
                        Définissez un départ et une arrivée pour voir les bus.
                    </div>
                )}

                {stopsError && (
                    <div className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-[13px] text-red-300">
                        {stopsError}
                    </div>
                )}

                <StopList
                    title="Arrêts près du départ"
                    stops={originStops}
                    loading={stopsLoading && origin !== null}
                    onSelect={(s) => setFocus({ lat: s.lat, lon: s.lon })}
                />
                <StopList
                    title="Arrêts près de l'arrivée"
                    stops={destStops}
                    loading={stopsLoading && dest !== null}
                    onSelect={(s) => setFocus({ lat: s.lat, lon: s.lon })}
                />

                <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-[13px] text-stone-400">
                    Cherchez, utilisez le GPS ou tapez la carte : le premier tap
                    définit le départ, le suivant l'arrivée. Faites glisser les
                    marqueurs pour ajuster.
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setDrawerOpen(false);
                        setTour("running");
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-stone-400 transition hover:bg-white/5 hover:text-white active:scale-[0.99]"
                >
                    <span
                        aria-hidden="true"
                        className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-stone-300 ring-1 ring-white/20"
                    >
                        ?
                    </span>
                    Revoir le tutoriel
                </button>
            </aside>

            {/* map action: search a quartier */}
            <button
                type="button"
                data-tour="quartier"
                onClick={() => {
                    setDrawerOpen(false);
                    setQuartierOpen(true);
                }}
                aria-label="Chercher un quartier"
                aria-haspopup="dialog"
                aria-controls="quartier-dialog"
                title="Chercher un quartier"
                className="absolute right-3 bottom-[max(2rem,calc(env(safe-area-inset-bottom)+1rem))] z-[1050] grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-stone-900/90 text-stone-200 shadow-2xl backdrop-blur transition hover:bg-white/5 active:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#FC3D32] focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="h-5 w-5"
                >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4.35-4.35" />
                </svg>
            </button>

            <QuartierSearch
                open={quartierOpen}
                onClose={() => setQuartierOpen(false)}
                selectedId={selectedQuartier?.id ?? null}
                onSelect={(neighborhood) => {
                    setSelectedQuartier(neighborhood);
                    setFocus({
                        lat: neighborhood.latitude,
                        lon: neighborhood.longitude,
                    });
                }}
            />

            <TourPrompt
                open={tour === "prompt"}
                onStart={() => setTour("running")}
                onSkip={() => setTour("idle")}
            />

            {tour === "running" && (
                <Tour
                    onClose={() => setTour("idle")}
                    onFinish={() => {
                        markTourSeen();
                        setTour("idle");
                    }}
                />
            )}
        </div>
    );
}
