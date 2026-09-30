import type { Stop } from '../lib/stops';

type Props = {
  title: string;
  stops: Stop[];
  loading: boolean;
  /** Shared spike error shown once; lists stay silent otherwise. */
  onSelect: (stop: Stop) => void;
};

/** Ranked stop candidates with walking distance. Click flies the map there. */
export default function StopList({ title, stops, loading, onSelect }: Props) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-400">
        {title}
      </p>
      {loading && (
        <div className="flex flex-col gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-white/5 ring-1 ring-white/10" />
          ))}
        </div>
      )}
      {!loading && stops.length === 0 && (
        <div className="rounded-lg border border-dashed border-white/15 p-3 text-center text-xs text-stone-400">
          No mapped stops within 500m.
        </div>
      )}
      {!loading && stops.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {stops.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s)}
                className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-left ring-1 ring-white/10 hover:ring-[#007E3A]"
              >
                <span className="truncate text-[13px] text-stone-100">{s.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-stone-400">{s.distanceM}m</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
