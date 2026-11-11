import { directLines, type BusLine } from '../lib/lines';
import { Chip, SectionLabel } from './ui';

type Props = {
  originLines: BusLine[];
  destLines: BusLine[];
  loading: boolean;
};

function LineChips({ lines }: { lines: BusLine[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {lines.map((l) => (
        <Chip key={l.ref} title={l.directions.join('\n')}>
          {l.ref}
        </Chip>
      ))}
    </div>
  );
}

function LineGroup({ title, lines }: { title: string; lines: BusLine[] }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium text-stone-500">
        {title}{' '}
        <span className="tabular-nums text-stone-600">({lines.length})</span>
      </p>
      {lines.length > 0 ? (
        <LineChips lines={lines} />
      ) : (
        <p className="text-[12px] text-stone-600">Aucune.</p>
      )}
    </div>
  );
}

/** Direct (no-transfer) line candidates + per-endpoint coverage. Transfers need route members (next step). */
export default function JourneyOptions({ originLines, destLines, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
        <div className="h-7 w-full animate-pulse rounded-lg bg-white/5" />
      </div>
    );
  }

  const direct = directLines(originLines, destLines);
  const totalRefs = new Set([...originLines, ...destLines].map((l) => l.ref)).size;

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <SectionLabel count={direct.length}>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
          />
          Lignes directes
        </SectionLabel>
        {direct.length > 0 ? (
          <LineChips lines={direct} />
        ) : (
          <p className="text-[12px] text-stone-500">
            Aucune ligne directe entre ces deux points.
          </p>
        )}
      </section>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 transition hover:text-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC3D32] [&::-webkit-details-marker]:hidden">
          Toutes les lignes
          <span className="tabular-nums font-medium text-stone-600">
            {totalRefs}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-180"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="mt-2 space-y-3 px-0.5">
          <LineGroup title="Près du départ" lines={originLines} />
          <LineGroup title="Près de l’arrivée" lines={destLines} />
        </div>
      </details>
    </div>
  );
}
