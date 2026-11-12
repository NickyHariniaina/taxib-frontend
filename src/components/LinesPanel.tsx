import { SectionLabel } from './ui';
import { useTranslations } from '../i18n';
import type { BusLineVariant } from '../lib/lines';

type Props = {
  /** The line currently shown on the map, if any. */
  selected: BusLineVariant | null;
  onBrowse: () => void;
};

/** Drawer entry point for the bus line catalogue. */
export default function LinesPanel({ selected, onBrowse }: Props) {
  const t = useTranslations('Lines');

  return (
    <section className="space-y-2">
      <SectionLabel>{t('title')}</SectionLabel>

      {selected ? (
        <div className="flex items-center gap-2 rounded-xl bg-raised px-3 py-2.5 ring-1 ring-line">
          <span className="font-mono text-[13px] font-bold text-ink">
            {selected.number}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] text-muted">
            {selected.name}
          </span>
        </div>
      ) : null}

      <button
        type="button"
        data-tour="lines"
        onClick={onBrowse}
        className="flex w-full items-center gap-2 rounded-xl bg-raised px-3 py-2.5 text-[12px] font-semibold text-ink transition hover:bg-raised-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4.35-4.35" />
        </svg>
        {t('browse')}
      </button>
    </section>
  );
}
