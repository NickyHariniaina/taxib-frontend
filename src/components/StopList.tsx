import type { Stop } from '../lib/stops';
import { useFormatter, useTranslations } from '../i18n';

type Props = {
  stops: Stop[];
  loading: boolean;
  emptyLabel: string;
  /** Dot colour cue, matching the map markers. */
  tone?: 'origin' | 'dest';
  onSelect: (stop: Stop) => void;
};

/** Ranked stop candidates with walking distance. Click flies the map there. */
export default function StopList({
  stops,
  loading,
  emptyLabel,
  tone = 'origin',
  onSelect,
}: Props) {
  const t = useTranslations('Stops');
  const format = useFormatter();

  if (loading) {
    return (
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-2xl bg-raised ring-1 ring-line"
      >
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-raised-strong" />
            <span className="h-3 flex-1 animate-pulse rounded bg-raised-strong" />
            <span className="h-3 w-10 animate-pulse rounded bg-raised-strong" />
          </div>
        ))}
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <p className="rounded-2xl bg-raised px-3 py-4 text-center text-[12px] text-faint ring-1 ring-line">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-raised ring-1 ring-line">
      <ul className="divide-y divide-line">
        {stops.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-raised focus-visible:bg-raised-strong focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  tone === 'dest' ? 'bg-sky-400' : 'bg-emerald-400'
                }`}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                {s.name ?? t('unnamed')}
              </span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-faint">
                {format.number(s.distanceM, {
                  style: 'unit',
                  unit: 'meter',
                  unitDisplay: 'short',
                  maximumFractionDigits: 0,
                })}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
