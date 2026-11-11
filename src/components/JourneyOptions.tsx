import { directLines, type BusLine } from '../lib/lines';
import { Chip, SectionLabel } from './ui';
import { useTranslations } from '../i18n';

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
  const t = useTranslations('Journey');
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium text-faint">
        {title}{' '}
        <span className="tabular-nums text-ghost">({lines.length})</span>
      </p>
      {lines.length > 0 ? (
        <LineChips lines={lines} />
      ) : (
        <p className="text-[12px] text-ghost">{t('none')}</p>
      )}
    </div>
  );
}

/** Direct (no-transfer) line candidates + per-endpoint coverage. Transfers need route members (next step). */
export default function JourneyOptions({ originLines, destLines, loading }: Props) {
  const t = useTranslations('Journey');
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-raised-strong" />
        <div className="h-7 w-full animate-pulse rounded-lg bg-raised" />
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
          {t('direct')}
        </SectionLabel>
        {direct.length > 0 ? (
          <LineChips lines={direct} />
        ) : (
          <p className="text-[12px] text-faint">
            {t('noneDirect')}
          </p>
        )}
      </section>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-faint transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
          {t('all')}
          <span className="tabular-nums font-medium text-ghost">
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
          <LineGroup title={t('nearOrigin')} lines={originLines} />
          <LineGroup title={t('nearDest')} lines={destLines} />
        </div>
      </details>
    </div>
  );
}
