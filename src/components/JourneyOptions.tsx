import { directLines, type BusLine } from '../lib/lines';

type Props = {
  originLines: BusLine[];
  destLines: BusLine[];
  loading: boolean;
};

function Chips({ lines }: { lines: BusLine[] }) {
  if (lines.length === 0) return <p className="text-xs text-stone-500">None found.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {lines.map((l) => (
        <span
          key={l.ref}
          title={l.directions.join('\n')}
          className="rounded-lg bg-white/5 px-2.5 py-1 font-mono text-xs font-bold text-stone-100 ring-1 ring-white/10"
        >
          {l.ref}
        </span>
      ))}
    </div>
  );
}

/** Direct (no-transfer) line candidates + per-endpoint coverage. Transfers need route members (next step). */
export default function JourneyOptions({ originLines, destLines, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="h-9 animate-pulse rounded-lg bg-white/5 ring-1 ring-white/10" />
        <div className="h-9 animate-pulse rounded-lg bg-white/5 ring-1 ring-white/10" />
      </div>
    );
  }
  const direct = directLines(originLines, destLines);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-green-400">
          Direct buses · no transfer
        </p>
        {direct.length > 0 ? (
          <Chips lines={direct} />
        ) : (
          <p className="text-xs text-stone-400">
            No single line covers both ends yet.
          </p>
        )}
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-400">
          Lines near origin ({originLines.length})
        </p>
        <Chips lines={originLines} />
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-400">
          Lines near destination ({destLines.length})
        </p>
        <Chips lines={destLines} />
      </div>
    </div>
  );
}
