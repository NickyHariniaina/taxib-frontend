import { useTranslations } from '../i18n';

type Props = {
  /** What the bar is about, e.g. the quartier name. */
  title: string;
  /** Secondary line: how many stops, loading, failure… */
  subtitle: string;
  onClear: () => void;
};

/**
 * Bottom bar for the map's current selection: what it is, and a button that
 * clears it from the map.
 */
export default function SelectionBar({ title, subtitle, onClear }: Props) {
  const t = useTranslations('Quartier');

  return (
    <div className="pointer-events-auto absolute bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] left-3 right-3 z-[1050] flex items-center gap-2 rounded-2xl border border-line bg-panel/95 py-2 pl-3 pr-2 shadow-2xl backdrop-blur">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{title}</p>
        <p className="truncate text-[11px] text-muted">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label={t('clearStops')}
        title={t('clearStops')}
        className="shrink-0 rounded-xl bg-raised px-3 py-2 text-[12px] font-semibold text-ink transition hover:bg-raised-strong active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {t('clearStops')}
      </button>
    </div>
  );
}
