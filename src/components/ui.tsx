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
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
        {children}
        {typeof count === 'number' && (
          <span className="tabular-nums font-medium text-stone-600">
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
      className="rounded-lg bg-white/[0.06] px-2 py-1 font-mono text-xs font-bold text-stone-200 ring-1 ring-white/[0.08]"
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
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-stone-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC3D32] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
