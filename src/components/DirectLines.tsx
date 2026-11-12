import { useFormatter, useTranslations } from '../i18n';
import type { BusLineGroup, DirectLine } from '../lib/lines';

type Props = {
  /** Lines serving a stop near both endpoints. */
  lines: DirectLine[];
  loading: boolean;
  failed: boolean;
  /** Number of the line currently drawn on the map, if any. */
  selected: string | null;
  onSelect: (group: BusLineGroup) => void;
};

/** Distance to a stop, in metres, as the map tooltips read it. */
function useMeters() {
  const format = useFormatter();

  return (meters: number | null) =>
    meters === null
      ? '—'
      : format.number(meters, {
          style: 'unit',
          unit: 'meter',
          unitDisplay: 'short',
          maximumFractionDigits: 0,
        });
}

/**
 * The direct lines between the two endpoints, pinned to the left edge of the
 * map. A line is listed when it serves a stop inside both 500 m circles, so
 * the list always matches the dots already on screen.
 */
export default function DirectLines({
  lines,
  loading,
  failed,
  selected,
  onSelect,
}: Props) {
  const t = useTranslations('DirectLines');
  const meters = useMeters();

  return (
    <aside
      data-tour="direct-lines"
      aria-label={t('title')}
      className="pointer-events-auto absolute left-3 top-[max(4.5rem,calc(env(safe-area-inset-top)+4.5rem))] z-[1045] flex max-h-[46vh] w-[min(47vw,13.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-panel/90 shadow-xl backdrop-blur"
    >
      <div className="flex shrink-0 items-baseline gap-1.5 border-b border-line px-2.5 py-1.5">
        <h2 className="truncate text-[10px] font-bold uppercase tracking-wide text-muted">
          {t('title')}
        </h2>
        {!loading && !failed && (
          <span className="ml-auto shrink-0 font-mono text-[11px] font-bold text-faint">
            {lines.length}
          </span>
        )}
      </div>

      {failed ? (
        <p className="px-2.5 py-3 text-[11px] leading-snug text-red-300">
          {t('failed')}
        </p>
      ) : loading ? (
        <p className="px-2.5 py-3 text-[11px] text-faint">{t('loading')}</p>
      ) : lines.length === 0 ? (
        <p className="px-2.5 py-3 text-[11px] leading-snug text-faint">
          {t('empty')}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
          {lines.map((line) => {
            const active = selected === line.number;

            return (
              <li key={line.number}>
                <button
                  type="button"
                  onClick={() => onSelect(line)}
                  aria-pressed={active}
                  className={`flex w-full items-stretch gap-1.5 rounded-lg px-1.5 py-1.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    active ? 'bg-raised-strong' : 'hover:bg-raised'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="w-1 shrink-0 rounded-full ring-1 ring-white/40"
                    style={{ backgroundColor: line.color ?? 'transparent' }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1">
                      <span className="font-mono text-[12px] font-bold text-ink">
                        {line.number}
                      </span>
                      <span className="truncate text-[11px] text-muted">
                        {line.variants[0]?.name}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ghost">
                      <span className="flex items-center gap-0.5">
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-[#22c55e]"
                        />
                        <span title={t('fromStart')}>{meters(line.fromStartM)}</span>
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-[#38bdf8]"
                        />
                        <span title={t('fromEnd')}>{meters(line.fromEndM)}</span>
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
