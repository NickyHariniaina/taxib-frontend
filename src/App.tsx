/* eslint-disable react/set-state-in-effect -- endpoint-driven async fetching syncs external data */
import { useEffect, useState } from "react";
import Map from "./components/Map";
import QuartierSearch from "./components/QuartierSearch";
import SelectionBar from "./components/SelectionBar";
import Tour from "./components/Tour";
import TourPrompt from "./components/TourPrompt";
import TripDrawer from "./components/TripDrawer";
import { getCurrentPosition, type LatLon } from "./lib/location";
import type { Place } from "./lib/geocode";
import {
    getNeighborhoodStops,
    type Neighborhood,
    type NeighborhoodStop,
} from "./lib/neighborhoods";
import { findNearbyStops, type Stop } from "./lib/stops";
import { fetchLineStops, type BusLineVariant, type LineStop } from "./lib/lines";
import LineDialog from "./components/LineDialog";
import StopLinesDialog from "./components/StopLinesDialog";
import type { TappableStop } from "./components/StopBadges";
import { getRoadPath, type RoadPath } from "./lib/directions";
import { hasSeenTour, markTourSeen } from "./lib/tour";
import { useFormatter, useTranslations, type ErrorKey } from "./i18n";

/** Label sentinel translated at render, so it follows the active locale. */
const GPS_LABEL = "\u0000gps";

/**
 * Stops of the selected quartier. Kept in one object so a new selection
 * replaces the previous stops in the same render, instead of leaving the old
 * ones on screen until the fetch settles.
 */
type QuartierStops = {
  /** Quartier the stops belong to. */
  id: number;
  stops: NeighborhoodStop[];
  loading: boolean;
  failed: boolean;
};

/** Radius of the stop-search zone, in metres. */
const ZONE_RADIUS_M = 500;

/** A stop-search zone: a centre, a radius and the stops inside it. */
type Zone = {
  /** Bumped on every search, so searching the same spot again refetches. */
  id: number;
  center: LatLon;
  radiusM: number;
  stops: Stop[];
  loading: boolean;
  failed: boolean;
};

const coordsLabel = (p: LatLon) => `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
const keyOf = (p: LatLon | null) => (p ? `${p.lat},${p.lon}` : "unset");

export default function App() {
    const t = useTranslations("App");
    const tQuartier = useTranslations("Quartier");
    const tStops = useTranslations("Stops");
    const format = useFormatter();
    // No defaults: the user sets each endpoint via search, GPS, or map tap.
    const [origin, setOrigin] = useState<LatLon | null>(null);
    const [dest, setDest] = useState<LatLon | null>(null);
    const [originLabel, setOriginLabel] = useState("");
    const [destLabel, setDestLabel] = useState("");
    const [selectedQuartier, setSelectedQuartier] = useState<Neighborhood | null>(
        null,
    );
    // Bumped on every pick, so re-picking the same quartier refetches it.
    const [quartierPick, setQuartierPick] = useState(0);
    const [quartierStops, setQuartierStops] = useState<QuartierStops | null>(
        null,
    );
    const [focus, setFocus] = useState<LatLon | null>(null);
    // Stop-search zone: a circle of a fixed radius around a tapped point.
    const [zoneMode, setZoneMode] = useState(false);
    const [zone, setZone] = useState<Zone | null>(null);
    const [error, setError] = useState<ErrorKey | null>(null);
    const [locating, setLocating] = useState(false);
    const [originStops, setOriginStops] = useState<Stop[]>([]);
    const [destStops, setDestStops] = useState<Stop[]>([]);
    const [stopsLoading, setStopsLoading] = useState(false);
    const [stopsError, setStopsError] = useState<ErrorKey | null>(null);
    const [lineDialogOpen, setLineDialogOpen] = useState(false);
    const [selectedLine, setSelectedLine] = useState<BusLineVariant | null>(null);
    const [lineStops, setLineStops] = useState<LineStop[]>([]);
    const [lineStopsLoading, setLineStopsLoading] = useState(false);
    const [lineStopsFailed, setLineStopsFailed] = useState(false);
    const [stopForLines, setStopForLines] = useState<TappableStop | null>(null);
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

    // Stops around each set endpoint, from the API. Debounced + aborted.
    useEffect(() => {
        setStopsError(null);
        if (!origin && !dest) {
            setOriginStops([]);
            setDestStops([]);
            setStopsLoading(false);
            return;
        }
        setStopsLoading(true);
        const ctrl = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const [o, d] = await Promise.all([
                    origin
                        ? findNearbyStops(origin, { signal: ctrl.signal })
                        : Promise.resolve([]),
                    dest
                        ? findNearbyStops(dest, { signal: ctrl.signal })
                        : Promise.resolve([]),
                ]);
                setOriginStops(o);
                setDestStops(d);
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError")
                    return;
                setStopsError("Errors.stops");
            } finally {
                setStopsLoading(false);
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

    // Stops of the selected quartier, straight from the API. A 404 means the
    // quartier has no stops, which is an empty list rather than a failure.
    useEffect(() => {
        if (!selectedQuartier) {
            setQuartierStops(null);
            return;
        }
        const ctrl = new AbortController();
        getNeighborhoodStops(selectedQuartier.name, ctrl.signal)
            .then((stops) => {
                if (ctrl.signal.aborted) return;
                setQuartierStops({
                    id: selectedQuartier.id,
                    stops,
                    loading: false,
                    failed: false,
                });
            })
            .catch((e) => {
                if (ctrl.signal.aborted) return;
                if (e instanceof DOMException && e.name === "AbortError") return;
                setQuartierStops({
                    id: selectedQuartier.id,
                    stops: [],
                    loading: false,
                    failed: true,
                });
            });
        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedQuartier?.id, quartierPick]);

    /** Selects a quartier and clears the previous one from the map. */
    const selectQuartier = (neighborhood: Neighborhood) => {
        setSelectedQuartier(neighborhood);
        setQuartierPick((n) => n + 1);
        setQuartierStops({
            id: neighborhood.id,
            stops: [],
            loading: true,
            failed: false,
        });
        // One exploration at a time: the zone would hide the quartier bar.
        setZone(null);
        setZoneMode(false);
    };

    // Stops inside the search zone. The zone id changes on every search, so
    // searching the same spot again refetches.
    useEffect(() => {
        if (!zone) return;
        const ctrl = new AbortController();
        findNearbyStops(
            zone.center,
            {
                radiusM: zone.radiusM,
                limit: 50,
                signal: ctrl.signal,
            },
        )
            .then((stops) => {
                if (ctrl.signal.aborted) return;
                setZone((z) =>
                    z && z.id === zone.id
                        ? { ...z, stops, loading: false }
                        : z,
                );
            })
            .catch((e) => {
                if (ctrl.signal.aborted) return;
                if (e instanceof DOMException && e.name === "AbortError") return;
                setZone((z) =>
                    z && z.id === zone.id
                        ? { ...z, stops: [], loading: false, failed: true }
                        : z,
                );
            });
        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zone?.id]);

    /** Drops a search zone centred on a tapped point. */
    const searchZoneAt = (p: LatLon) => {
        setZoneMode(false);
        setSelectedQuartier(null);
        setQuartierStops(null);
        setZone({
            id: Date.now(),
            center: p,
            radiusM: ZONE_RADIUS_M,
            stops: [],
            loading: true,
            failed: false,
        });
    };

    /** Enters the "pick the centre of the zone" mode. */
    const startZoneSearch = () => {
        setDrawerOpen(false);
        setZoneMode((mode) => {
            if (!mode) {
                // One exploration at a time: the quartier bar would overlap.
                setSelectedQuartier(null);
                setQuartierStops(null);
            } else {
                setZone(null);
            }
            return !mode;
        });
    };

    // Stops of the selected line. Re-picking the same line refetches it.
    useEffect(() => {
        if (!selectedLine) {
            setLineStops([]);
            setLineStopsFailed(false);
            return;
        }
        const ctrl = new AbortController();
        setLineStopsLoading(true);
        setLineStopsFailed(false);
        fetchLineStops(selectedLine.number, ctrl.signal)
            .then((stops) => {
                if (ctrl.signal.aborted) return;
                setLineStops(stops);
                setLineStopsLoading(false);
            })
            .catch((e) => {
                if (ctrl.signal.aborted) return;
                if (e instanceof DOMException && e.name === "AbortError")
                    return;
                setLineStopsFailed(true);
                setLineStopsLoading(false);
            });
        return () => ctrl.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLine?.number]);

    /** A stop badge was tapped: show the lines that serve it. */
    const showLinesAtStop = (stop: TappableStop) => setStopForLines(stop);

    /** Picks a line: it takes over the map, replacing any other selection. */
    const selectLine = (variant: BusLineVariant) => {
        setSelectedLine(variant);
        setLineDialogOpen(false);
        setStopForLines(null);
        setSelectedQuartier(null);
        setQuartierStops(null);
        setZone(null);
        setZoneMode(false);
    };

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
        // In zone-search mode a tap centres the search instead.
        if (zoneMode) {
            searchZoneAt(p);
            return;
        }
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

    /** Removes the quartier mark and its stops from the map. */
    const clearQuartier = () => {
        setSelectedQuartier(null);
        setQuartierStops(null);
    };

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

    // Stops of the quartier on screen; null until its fetch settles.
    const stopList =
        quartierStops && quartierStops.id === selectedQuartier?.id
            ? quartierStops
            : null;

    const radiusLabel = format.number(ZONE_RADIUS_M, {
        style: "unit",
        unit: "meter",
        unitDisplay: "short",
        maximumFractionDigits: 0,
    });

    return (
        <div
            className={`relative h-svh overflow-hidden bg-canvas text-ink overscroll-none ${zoneMode ? "map-picking" : ""}`}
        >
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
                    quartierStops={stopList?.stops ?? []}
                    quartierStopsLoaded={stopList !== null && !stopList.loading}
                    zone={
                        zone
                            ? { center: zone.center, radiusM: zone.radiusM }
                            : null
                    }
                    zoneStops={zone?.stops ?? []}
                    lineStops={lineStops}
                    onStopSelect={showLinesAtStop}
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
                selectedLine={selectedLine}
                onBrowseLines={() => setLineDialogOpen(true)}
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

            {/* map actions: search a bus stop zone, search a quartier */}
            <div className="absolute right-3 bottom-[max(2rem,calc(env(safe-area-inset-bottom)+1rem))] z-[1050] flex items-center gap-2">
                <button
                    type="button"
                    data-tour="stops"
                    onClick={startZoneSearch}
                    aria-pressed={zoneMode}
                    aria-label={t("searchStops")}
                    title={t("searchStops")}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line bg-panel/90 text-ink shadow-2xl backdrop-blur transition hover:bg-raised active:bg-raised-strong focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                        zoneMode ? "bg-brand text-brand-ink" : ""
                    }`}
                >
                    <svg
                        viewBox="0 0 28 28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="h-7 w-7"
                    >
                        <path
                            transform="translate(-1 -1) scale(0.78)"
                            d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm-1 0h14V6H3v10zm1-11h12c.55 0 1 .45 1 1v3H4V6c0-.55.45-1 1-1zm2 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM7 13V7h10v6H7z"
                        />
                        <circle cx="19.5" cy="18.5" r="5" />
                        <path d="M23 22 L26 25" />
                    </svg>
                </button>
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
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line bg-panel/90 text-ink shadow-2xl backdrop-blur transition hover:bg-raised active:bg-raised-strong focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
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
            </div>

            {/* hint while the zone centre is being picked */}
            {zoneMode && (
                <div className="pointer-events-auto absolute bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] left-3 right-3 z-[1050] flex items-center gap-2 rounded-2xl border border-brand/40 bg-panel/95 px-3 py-2.5 text-[13px] font-medium text-ink shadow-2xl backdrop-blur">
                    <span className="flex-1">{t("zoneHint")}</span>
                    <button
                        type="button"
                        onClick={() => setZoneMode(false)}
                        className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-semibold text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                        {t("zoneCancel")}
                    </button>
                </div>
            )}

            {/* selected quartier: name, stop count, clear */}
            {selectedQuartier && (
                <SelectionBar
                    title={selectedQuartier.name}
                    subtitle={
                        stopList === null
                            ? tStops('loading')
                            : stopList.loading
                              ? tStops('loading')
                              : stopList.failed
                                ? tStops('failed')
                                : tStops('count', {
                                      count: stopList.stops.length,
                                  })
                    }
                    onClear={clearQuartier}
                />
            )}

            {/* selected line: its stops */}
            {selectedLine && (
                <SelectionBar
                    title={`${selectedLine.number} · ${selectedLine.name}`}
                    subtitle={
                        lineStopsLoading
                            ? tStops('loading')
                            : lineStopsFailed
                              ? tStops('failed')
                              : tStops('count', { count: lineStops.length })
                    }
                    onClear={() => setSelectedLine(null)}
                />
            )}

            {/* search zone: stop count, radius, clear */}
            {zone && (
                <SelectionBar
                    title={tQuartier("zoneTitle")}
                    subtitle={
                        zone.loading
                            ? tStops('loading')
                            : zone.failed
                              ? tStops('failed')
                              : tQuartier("zoneCount", {
                                    count: zone.stops.length,
                                    radius: radiusLabel,
                                })
                    }
                    onClear={() => setZone(null)}
                />
            )}

            <StopLinesDialog
                stop={stopForLines}
                onClose={() => setStopForLines(null)}
                onSelect={selectLine}
                onSetOrigin={() => {
                    if (!stopForLines) return;
                    setOrigin({ lat: stopForLines.lat, lon: stopForLines.lon });
                    setOriginLabel(stopForLines.name);
                    setStopForLines(null);
                }}
                onSetDest={() => {
                    if (!stopForLines) return;
                    setDest({ lat: stopForLines.lat, lon: stopForLines.lon });
                    setDestLabel(stopForLines.name);
                    setStopForLines(null);
                }}
            />

            <LineDialog
                open={lineDialogOpen}
                onClose={() => setLineDialogOpen(false)}
                onSelect={selectLine}
            />

            <QuartierSearch
                open={quartierOpen}
                onClose={() => setQuartierOpen(false)}
                selectedId={selectedQuartier?.id ?? null}
                onClear={clearQuartier}
                onSelect={selectQuartier}
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
