import { useTranslations } from '../i18n';

type Props = {
  name: string;
  onClear: () => void;
};

/**
 * Floating pill for the selected quartier: its name plus a button that removes
 * the mark from the map. Lives above the map so it stays reachable with the
 * drawer closed.
 */
export default function QuartierChip({ name, onClear }: Props) {
  const t = useTranslations('Quartier');

  return (
    <div className="pointer-events-auto absolute bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))] left-3 z-[1050] flex max-w-[72vw] items-center gap-2 rounded-2xl border border-line bg-panel/95 py-1.5 pl-3 pr-1.5 shadow-2xl backdrop-blur">
      <span className="min-w-0 truncate text-[13px] font-semibold text-ink">
        {name}
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label={t('remove')}
        title={t('remove')}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-raised text-ink transition hover:bg-raised-strong active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        ✕
      </button>
    </div>
  );
}
