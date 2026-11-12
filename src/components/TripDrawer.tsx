import { useState } from 'react';
import AppearancePicker from './AppearancePicker';
import LinesPanel from './LinesPanel';
import LocaleSwitcher from './LocaleSwitcher';
import Notice from './Notice';
import SearchField from './SearchField';
import StopList from './StopList';
import { IconButton, SectionLabel } from './ui';
import type { RoadPath } from '../lib/directions';
import type { Place } from '../lib/geocode';
import type { BusLineVariant } from '../lib/lines';
import type { LatLon } from '../lib/location';
import type { Stop } from '../lib/stops';
import {
  BETA_LOCALES,
  useFormatter,
  useLocale,
  useTranslations,
  type ErrorKey,
} from '../i18n';

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
  stopsError: ErrorKey | null;
  /** Line currently shown on the map, if any. */
  selectedLine: BusLineVariant | null;
  /** Opens the bus line catalogue. */
  onBrowseLines: () => void;
  road: RoadPath | null;
  roadLoading: boolean;
  roadError: ErrorKey | null;
  locating: boolean;
  error: ErrorKey | null;
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
  selectedLine,
  onBrowseLines,
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
  const t = useTranslations('Drawer');
  const tApp = useTranslations('App');
  const tStops = useTranslations('Stops');
  const tNotice = useTranslations();
  const tLocale = useTranslations('Locale');
  const format = useFormatter();
  const locale = useLocale();

  const tripReady = origin !== null && dest !== null;
  // One banner at a time: connectivity failures would otherwise stack up.
  const notice = error ?? stopsError ?? roadError;
  const endpoint = tab === 'origin' ? origin : dest;
  const shownStops = tab === 'origin' ? originStops : destStops;
  const emptyLabel = !endpoint
    ? tab === 'origin'
      ? tStops('pickOrigin')
      : tStops('pickDest')
    : tStops('none');

  return (
    <aside
      inert={!open}
      aria-hidden={!open}
      aria-label={t('menu')}
      className={`absolute inset-y-0 left-0 z-[1300] flex w-[88vw] max-w-[400px] flex-col border-r border-line bg-panel/95 shadow-2xl backdrop-blur transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
        <img
          src="/logo.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-xl shadow-lg"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight">taxib</h1>
          <p className="truncate text-[11px] text-muted">
            {tApp('tagline')}
          </p>
        </div>
        <IconButton label={t('close')} onClick={onClose}>
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
                  className="rounded-lg text-[11px] font-semibold text-faint transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {t('reset')}
                </button>
              ) : undefined
            }
          >
            {t('title')}
          </SectionLabel>

          <div className="rounded-2xl bg-raised ring-1 ring-line">
            <div className="relative px-2 pt-2">
              <span
                aria-hidden="true"
                className="absolute top-1/4 bottom-1/4 left-[22px] w-px bg-line"
              />
              <div className="relative flex items-center gap-3 rounded-xl focus-within:bg-raised">
                <span
                  aria-hidden="true"
                  className="ml-2 h-4 w-4 shrink-0 rounded-full border-2 border-brand bg-panel"
                />
                <div className="min-w-0 flex-1">
                  <SearchField
                    bare
                    label={t('tabOrigin')}
                    placeholder={t('originPlaceholder')}
                    value={originLabel}
                    onPick={onPickOrigin}
                    onClear={onClearOrigin}
                  />
                </div>
              </div>
              <div className="relative flex items-center gap-3 rounded-xl focus-within:bg-raised">
                <span
                  aria-hidden="true"
                  className="ml-2 h-4 w-4 shrink-0 rounded-full border-2 border-muted bg-panel"
                />
                <div className="min-w-0 flex-1">
                  <SearchField
                    bare
                    label={t('tabDest')}
                    placeholder={t('destPlaceholder')}
                    value={destLabel}
                    onPick={onPickDest}
                    onClear={onClearDest}
                  />
                </div>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-1.5 border-t border-line px-2 py-2">
              <button
                type="button"
                onClick={onUseGps}
                disabled={locating}
                aria-label={t('useMyPosition')}
                className="flex items-center gap-1.5 rounded-lg bg-raised px-2.5 py-1.5 text-[12px] font-semibold text-ink ring-1 ring-line transition hover:bg-raised-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
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
                {locating ? t('locating') : t('myPosition')}
              </button>

              <IconButton label={t('swap')} onClick={onSwap}>
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

              <span className="ml-auto pr-1 text-[13px] font-semibold tabular-nums text-ink">
                {tripReady && roadLoading ? (
                  <span className="block h-3.5 w-14 animate-pulse rounded bg-raised-strong" />
                ) : road ? (
                  format.number(road.distanceM / 1000, {
                    style: 'unit',
                    unit: 'kilometer',
                    unitDisplay: 'short',
                    maximumFractionDigits: 1,
                  })
                ) : (
                  <span className="text-ghost">—</span>
                )}
              </span>
            </div>
          </div>
        </section>

        {notice && <Notice>{tNotice(notice)}</Notice>}

        {tripReady ? (
          <LinesPanel
            selected={selectedLine}
            onBrowse={onBrowseLines}
          />
        ) : (
          <p className="text-[12px] text-faint">{t('busHint')}</p>
        )}

        {(origin || dest) && (
          <section className="space-y-2">
            <SectionLabel count={shownStops.length}>
              {tStops('section')}
            </SectionLabel>
            <div
              role="tablist"
              aria-label={tStops('section')}
              className="grid grid-cols-2 gap-1 rounded-xl bg-raised p-1 ring-1 ring-line"
            >
              {(
                [
                  ['origin', t('tabOrigin')],
                  ['dest', t('tabDest')],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    tab === value
                      ? 'bg-raised-strong text-ink-strong shadow-sm'
                      : 'text-muted hover:text-ink'
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

        <AppearancePicker />
      </div>

      <footer className="shrink-0 border-t border-line px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-2 px-2 pb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ghost">
            {t('language')}
          </span>
          <LocaleSwitcher />
        </div>
        {BETA_LOCALES.includes(locale) && (
          <p className="px-2 pb-1.5 text-[11px] leading-relaxed text-faint">
            {tLocale('betaNote')}
          </p>
        )}
        <button
          type="button"
          onClick={onReplayTour}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-[12px] font-semibold text-muted transition hover:bg-raised hover:text-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span
            aria-hidden="true"
            className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-ink ring-1 ring-line-strong"
          >
            ?
          </span>
          {t('replayTour')}
        </button>
      </footer>
    </aside>
  );
}
