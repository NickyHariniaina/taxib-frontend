import { useTranslations } from '../i18n';
import type { BusLineGroup, BusLineVariant } from '../lib/lines';

function DirectionBadge({ direction }: { direction: string | null }) {
  const t = useTranslations('Lines');

  const label =
    direction === 'Aller'
      ? t('directions.aller')
      : direction === 'Retour'
        ? t('directions.retour')
        : direction === 'Circulaire'
          ? t('directions.circulaire')
          : direction;

  if (!label) return null;

  return (
    <span className="shrink-0 rounded-md bg-raised-strong px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
      {label}
    </span>
  );
}

function Variant({
  variant,
  onSelect,
}: {
  variant: BusLineVariant;
  onSelect?: (variant: BusLineVariant) => void;
}) {
  const t = useTranslations('Lines');

  return (
    <div className="mt-1.5 pl-3">
      <div className="flex items-center gap-2">
        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(variant)}
            className="min-w-0 flex-1 truncate text-left text-[12px] text-ink transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {variant.name}
          </button>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[12px] text-ink">
            {variant.name}
          </span>
        )}
        <DirectionBadge direction={variant.direction} />
      </div>
      {(variant.origin || variant.terminus) && (
        <p className="mt-0.5 truncate text-[11px] text-muted">
          {variant.origin} → {variant.terminus}
        </p>
      )}
      {variant.stopCount !== null && (
        <p className="text-[11px] text-ghost">
          {t('stopsCount', { count: variant.stopCount })}
        </p>
      )}
    </div>
  );
}

/** Bus lines, grouped by number, with their variants. */
export default function LineList({
  groups,
  onSelect,
}: {
  groups: BusLineGroup[];
  onSelect?: (variant: BusLineVariant) => void;
}) {
  const t = useTranslations('Lines');

  if (groups.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-[13px] text-faint">
        {t('empty')}
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {groups.map((group) => (
        <li
          key={group.number}
          className="rounded-xl bg-raised/60 px-3 py-2 ring-1 ring-line"
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-5 w-1.5 shrink-0 rounded-full ring-1 ring-white/40"
              style={{ backgroundColor: group.color ?? 'transparent' }}
            />
            <span className="font-mono text-[13px] font-bold text-ink">
              {group.number}
            </span>
            <span className="ml-auto text-[11px] text-ghost">
              {t('variantCount', { count: group.variants.length })}
            </span>
          </div>
          {group.variants.map((variant) => (
            <Variant
              key={`${variant.name}-${variant.direction ?? ''}`}
              variant={variant}
              onSelect={onSelect}
            />
          ))}
        </li>
      ))}
    </ul>
  );
}
