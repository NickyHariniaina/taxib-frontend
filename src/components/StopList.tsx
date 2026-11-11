import type { Stop } from '../lib/stops';

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
  if (loading) {
    return (
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07]"
      >
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-white/20" />
            <span className="h-3 flex-1 animate-pulse rounded bg-white/10" />
            <span className="h-3 w-10 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <p className="rounded-2xl bg-white/[0.04] px-3 py-4 text-center text-[12px] text-stone-500 ring-1 ring-white/[0.07]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.07]">
      <ul className="divide-y divide-white/[0.06]">
        {stops.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  tone === 'dest' ? 'bg-sky-400' : 'bg-emerald-400'
                }`}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] text-stone-200">
                {s.name}
              </span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-stone-500">
                {s.distanceM} m
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
