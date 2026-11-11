import type { ReactNode } from 'react';

type SectionLabelProps = {
  children: ReactNode;
  count?: number;
  action?: ReactNode;
};

/** Small uppercase heading used above each drawer section. */
export function SectionLabel({ children, count, action }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
        {children}
        {typeof count === 'number' && (
          <span className="tabular-nums font-medium text-ghost">
            {count}
          </span>
        )}
      </p>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

type ChipProps = {
  children: ReactNode;
  title?: string;
};

/** Neutral rounded tag for a bus line reference. */
export function Chip({ children, title }: ChipProps) {
  return (
    <span
      title={title}
      className="rounded-lg bg-raised-strong px-2 py-1 font-mono text-xs font-bold text-ink ring-1 ring-line"
    >
      {children}
    </span>
  );
}

type IconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

/** Square icon-only button with a shared focus and press treatment. */
export function IconButton({
  label,
  onClick,
  children,
  disabled,
  className = '',
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-raised text-ink ring-1 ring-line transition hover:bg-raised-strong hover:text-ink-strong active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
