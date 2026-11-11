/* eslint-disable react/set-state-in-effect -- endpoint-driven async fetching syncs external data */
import { useEffect, useState } from "react";
import Map from "./components/Map";
import QuartierSearch from "./components/QuartierSearch";
import QuartierChip from "./components/QuartierChip";
import Tour from "./components/Tour";
import TourPrompt from "./components/TourPrompt";
import TripDrawer from "./components/TripDrawer";
import { getCurrentPosition, type LatLon } from "./lib/location";
import type { Place } from "./lib/geocode";
import type { Neighborhood } from "./lib/neighborhoods";
import { findNearbyStops, type Stop } from "./lib/stops";
import { findLinesNear, type BusLine } from "./lib/lines";
import { getRoadPath, type RoadPath } from "./lib/directions";
import { hasSeenTour, markTourSeen } from "./lib/tour";
import { useTranslations, type ErrorKey } from "./i18n";

/** Label sentinel translated at render, so it follows the active locale. */
const GPS_LABEL = "\u0000gps";

const coordsLabel = (p: LatLon) => `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
const keyOf = (p: LatLon | null) => (p ? `${p.lat},${p.lon}` : "unset");

export default function App() {
    const t = useTranslations("App");
    // No defaults: the user sets each endpoint via search, GPS, or map tap.
    const [origin, setOrigin] = useState<LatLon | null>(null);
    const [dest, setDest] = useState<LatLon | null>(null);
    const [originLabel, setOriginLabel] = useState("");
    const [destLabel, setDestLabel] = useState("");
    const [selectedQuartier, setSelectedQuartier] = useState<Neighborhood | null>(
        null,
    );
    const [focus, setFocus] = useState<LatLon | null>(null);
    const [error, setError] = useState<ErrorKey | null>(null);
    const [locating, setLocating] = useState(false);
    const [originStops, setOriginStops] = useState<Stop[]>([]);
    const [destStops, setDestStops] = useState<Stop[]>([]);
    const [stopsLoading, setStopsLoading] = useState(false);
    const [stopsError, setStopsError] = useState<ErrorKey | null>(null);
    const [originLines, setOriginLines] = useState<BusLine[]>([]);
    const [destLines, setDestLines] = useState<BusLine[]>([]);
    const [linesLoading, setLinesLoading] = useState(false);
    const [linesError, setLinesError] = useState<ErrorKey | null>(null);
    const [road, setRoad] = useState<RoadPath | null>(null);
    const [roadLoading, setRoadLoading] = useState(false);
    const [roadError, setRoadError] = useState<ErrorKey | null>(null);
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
                setStopsError("Errors.stops");
                setLinesError("Errors.lines");
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
                        ? "Errors.routeNotFound"
                        : "Errors.routeUnavailable",
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
            setOriginLabel(GPS_LABEL);
            setFocus(p);
            setDrawerOpen(false);
        } catch (e) {
            const code = e instanceof Error ? e.message : "";
            setError(
                code === "location-permission-denied"
                    ? "Errors.gpsDenied"
                    : code === "geolocation-unsupported"
                      ? "Errors.gpsUnsupported"
                      : "Errors.gpsUnavailable",
            );
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

    const swapEndpoints = () => {
        setOrigin(dest);
        setDest(origin);
        setOriginLabel(destLabel);
        setDestLabel(originLabel);
    };

    const resetTrip = () => {
        setOrigin(null);
        setDest(null);
        setOriginLabel("");
        setDestLabel("");
    };

    /** Removes the quartier mark from the map. */
    const clearQuartier = () => setSelectedQuartier(null);

    /** Removes one endpoint and its label; shared by the drawer and the map. */
    const clearOrigin = () => {
        setOrigin(null);
        setOriginLabel("");
    };

    const clearDest = () => {
        setDest(null);
        setDestLabel("");
    };

    // GPS labels are stored as a sentinel so they follow a language switch.
    const originText =
        originLabel === GPS_LABEL ? t("currentLocation") : originLabel;
    const destText = destLabel === GPS_LABEL ? t("currentLocation") : destLabel;

    return (
        <div className="relative h-svh overflow-hidden bg-canvas text-ink overscroll-none">
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
                    onClearNeighborhood={clearQuartier}
                    onClearOrigin={clearOrigin}
                    onClearDest={clearDest}
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
                    aria-label={drawerOpen ? t("closeMenu") : t("openMenu")}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-line bg-panel/90 shadow-2xl backdrop-blur active:scale-95"
                >
                    <span className="relative block h-4 w-5">
                        <span
                            className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-ink-strong transition-all duration-300 ${
                                drawerOpen
                                    ? "top-1/2 -translate-y-1/2 rotate-45"
                                    : ""
                            }`}
                        />
                        <span
                            className={`absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded bg-ink-strong transition-all duration-300 ${
                                drawerOpen ? "opacity-0" : ""
                            }`}
                        />
                        <span
                            className={`absolute bottom-0 left-0 h-0.5 w-5 rounded bg-ink-strong transition-all duration-300 ${
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
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-line bg-panel/90 px-3 py-2 text-left shadow-2xl backdrop-blur active:scale-[0.99]"
                >
                    <img
                        src="/logo.png"
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-lg"
                        width={32}
                        height={32}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                        {originText || destText ? (
                            <>
                                <span className="font-semibold text-ink-strong">
                                    {originText || t("origin")}
                                </span>
                                <span className="text-muted">
                                    {" "}
                                    → {destText || t("dest")}
                                </span>
                            </>
                        ) : (
                            <span className="text-muted">
                                {t("whereTo")}
                            </span>
                        )}
                    </span>
                </button>
                <button
                    type="button"
                    data-tour="gps"
                    onClick={useGps}
                    disabled={locating}
                    title={t("useGps")}
                    aria-label={t("useGps")}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-line bg-panel/90 text-lg shadow-2xl backdrop-blur active:scale-95 disabled:opacity-60"
                >
                    {locating ? "…" : "◎"}
                </button>
            </header>

            {/* backdrop */}
            <div
                onClick={() => setDrawerOpen(false)}
                aria-hidden={!drawerOpen}
                className={`absolute inset-0 z-[1200] bg-scrim backdrop-blur-[2px] transition-opacity duration-300 ${
                    drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
            />

            {/* drawer */}
            <TripDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                origin={origin}
                dest={dest}
                originLabel={originText}
                destLabel={destText}
                originStops={originStops}
                destStops={destStops}
                stopsLoading={stopsLoading}
                stopsError={stopsError}
                originLines={originLines}
                destLines={destLines}
                linesLoading={linesLoading}
                linesError={linesError}
                road={road}
                roadLoading={roadLoading}
                roadError={roadError}
                locating={locating}
                error={error}
                onPickOrigin={pickOrigin}
                onPickDest={pickDest}
                onClearOrigin={clearOrigin}
                onClearDest={clearDest}
                onUseGps={useGps}
                onSwap={swapEndpoints}
                onReset={resetTrip}
                onFocusStop={(s) => setFocus({ lat: s.lat, lon: s.lon })}
                onReplayTour={() => {
                    setDrawerOpen(false);
                    setTour("running");
                }}
            />

            {/* map action: search a quartier */}
            <button
                type="button"
                data-tour="quartier"
                onClick={() => {
                    setDrawerOpen(false);
                    setQuartierOpen(true);
                }}
                aria-label={t("searchQuartier")}
                aria-haspopup="dialog"
                aria-controls="quartier-dialog"
                title={t("searchQuartier")}
                className="absolute right-3 bottom-[max(2rem,calc(env(safe-area-inset-bottom)+1rem))] z-[1050] grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line bg-panel/90 text-ink shadow-2xl backdrop-blur transition hover:bg-raised active:bg-raised-strong focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
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

            {/* selected quartier: name + remove */}
            {selectedQuartier && (
                <QuartierChip
                    name={selectedQuartier.name}
                    onClear={clearQuartier}
                />
            )}

            <QuartierSearch
                open={quartierOpen}
                onClose={() => setQuartierOpen(false)}
                selectedId={selectedQuartier?.id ?? null}
                onClear={clearQuartier}
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
