import { useState } from 'react';
import JourneyOptions from './JourneyOptions';
import Notice from './Notice';
import SearchField from './SearchField';
import StopList from './StopList';
import { IconButton, SectionLabel } from './ui';
import { formatTrip, type RoadPath } from '../lib/directions';
import type { Place } from '../lib/geocode';
import type { BusLine } from '../lib/lines';
import type { LatLon } from '../lib/location';
import type { Stop } from '../lib/stops';

type Props = {
  open: boolean;
  onClose: () => void;
  origin: LatLon | null;
  dest: LatLon | null;
  originLabel: string;
  destLabel: string;
  originStops: Stop[];
  destStops: Stop[];
  stopsLoading: boolean;
  stopsError: string | null;
  originLines: BusLine[];
  destLines: BusLine[];
  linesLoading: boolean;
  linesError: string | null;
  road: RoadPath | null;
  roadLoading: boolean;
  roadError: string | null;
  locating: boolean;
  error: string | null;
  onPickOrigin: (place: Place) => void;
  onPickDest: (place: Place) => void;
  onClearOrigin: () => void;
  onClearDest: () => void;
  onUseGps: () => void;
  onSwap: () => void;
  onReset: () => void;
  onFocusStop: (stop: Stop) => void;
  onReplayTour: () => void;
};

/**
 * Slide-in menu: trip inputs first, then line and stop results. The header and
 * footer stay put while the middle scrolls.
 */
export default function TripDrawer({
  open,
  onClose,
  origin,
  dest,
  originLabel,
  destLabel,
  originStops,
  destStops,
  stopsLoading,
  stopsError,
  originLines,
  destLines,
  linesLoading,
  linesError,
  road,
  roadLoading,
  roadError,
  locating,
  error,
  onPickOrigin,
  onPickDest,
  onClearOrigin,
  onClearDest,
  onUseGps,
  onSwap,
  onReset,
  onFocusStop,
  onReplayTour,
}: Props) {
  const [tab, setTab] = useState<'origin' | 'dest'>('origin');

  const tripReady = origin !== null && dest !== null;
  // One banner at a time: connectivity failures would otherwise stack up.
  const notice = error ?? linesError ?? stopsError ?? roadError;
  const endpoint = tab === 'origin' ? origin : dest;
  const shownStops = tab === 'origin' ? originStops : destStops;
  const emptyLabel = !endpoint
    ? tab === 'origin'
      ? 'Définissez un départ pour voir les arrêts.'
      : 'Définissez une arrivée pour voir les arrêts.'
    : 'Aucun arrêt cartographié dans un rayon de 500 m.';

  return (
    <aside
      inert={!open}
      aria-hidden={!open}
      aria-label="Menu"
      className={`absolute inset-y-0 left-0 z-[1300] flex w-[88vw] max-w-[400px] flex-col border-r border-white/10 bg-stone-900/95 shadow-2xl backdrop-blur transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
        <img
          src="/logo.png"
          alt="taxib logo"
          width={40}
          height={40}
          className="h-10 w-10 rounded-xl shadow-lg"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight">taxib</h1>
          <p className="truncate text-[11px] text-stone-400">
            Lignes de bus · Antananarivo
          </p>
        </div>
        <IconButton label="Fermer le menu" onClick={onClose}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </IconButton>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pt-4 pb-5">
        <section className="space-y-2">
          <SectionLabel
            action={
              origin || dest ? (
                <button
                  type="button"
                  onClick={onReset}
                  className="rounded-lg text-[11px] font-semibold text-stone-500 transition hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC3D32]"
                >
                  Réinitialiser
                </button>
              ) : undefined
            }
          >
            Votre trajet
          </SectionLabel>

          <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07]">
            <div className="relative px-2 pt-2">
              <span
                aria-hidden="true"
                className="absolute top-1/4 bottom-1/4 left-[22px] w-px bg-white/10"
              />
              <div className="relative flex items-center gap-3 rounded-xl focus-within:bg-white/[0.03]">
                <span
                  aria-hidden="true"
                  className="ml-2 h-3 w-3 shrink-0 rounded-full border-2 border-[#FC3D32] bg-stone-900"
                />
                <div className="min-w-0 flex-1">
                  <SearchField
                    bare
                    label="Départ"
                    placeholder="D'où partez-vous ?"
                    value={originLabel}
                    onPick={onPickOrigin}
                    onClear={onClearOrigin}
                  />
                </div>
              </div>
              <div className="relative flex items-center gap-3 rounded-xl focus-within:bg-white/[0.03]">
                <span
                  aria-hidden="true"
                  className="ml-2 h-3 w-3 shrink-0 rounded-full border-2 border-stone-400 bg-stone-900"
                />
                <div className="min-w-0 flex-1">
                  <SearchField
                    bare
                    label="Arrivée"
                    placeholder="Vers où ?"
                    value={destLabel}
                    onPick={onPickDest}
                    onClear={onClearDest}
                  />
                </div>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-1.5 border-t border-white/[0.06] px-2 py-2">
              <button
                type="button"
                onClick={onUseGps}
                disabled={locating}
                aria-label="Utiliser ma position"
                className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-stone-200 ring-1 ring-white/10 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC3D32] disabled:opacity-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                >
                  <circle cx="12" cy="12" r="7" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
                {locating ? 'Localisation…' : 'Ma position'}
              </button>

              <IconButton label="Échanger départ et arrivée" onClick={onSwap}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="h-4 w-4"
                >
                  <path d="m21 16-4 4-4-4" />
                  <path d="M17 20V4" />
                  <path d="m3 8 4-4 4 4" />
                  <path d="M7 4v16" />
                </svg>
              </IconButton>

              <span className="ml-auto pr-1 text-[13px] font-semibold tabular-nums text-stone-200">
                {tripReady && roadLoading ? (
                  <span className="block h-3.5 w-14 animate-pulse rounded bg-white/10" />
                ) : road ? (
                  formatTrip(road.distanceM)
                ) : (
                  <span className="text-stone-600">—</span>
                )}
              </span>
            </div>
          </div>
        </section>

        {notice && <Notice>{notice}</Notice>}

        {tripReady ? (
          <JourneyOptions
            originLines={originLines}
            destLines={destLines}
            loading={linesLoading}
          />
        ) : (
          <p className="text-[12px] text-stone-500">
            Définissez un départ et une arrivée pour voir les bus.
          </p>
        )}

        {(origin || dest) && (
          <section className="space-y-2">
            <SectionLabel count={shownStops.length}>Arrêts proches</SectionLabel>
            <div
              role="tablist"
              aria-label="Arrêts proches"
              className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/[0.06]"
            >
              {(
                [
                  ['origin', 'Départ'],
                  ['dest', 'Arrivée'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC3D32] ${
                    tab === value
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <StopList
              stops={shownStops}
              loading={stopsLoading && endpoint !== null}
              emptyLabel={emptyLabel}
              tone={tab}
              onSelect={onFocusStop}
            />
          </section>
        )}
      </div>

      <footer className="shrink-0 border-t border-white/[0.06] px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onReplayTour}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-[12px] font-semibold text-stone-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC3D32]"
        >
          <span
            aria-hidden="true"
            className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-stone-300 ring-1 ring-white/20"
          >
            ?
          </span>
          Revoir le tutoriel
        </button>
      </footer>
    </aside>
  );
}
