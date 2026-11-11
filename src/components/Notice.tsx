import type { ReactNode } from 'react';

/** Single alert banner; the drawer only ever shows one at a time. */
export default function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-[12.5px] leading-relaxed text-red-200 ring-1 ring-red-500/20"
    >
      <span
        aria-hidden="true"
        className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-red-500/20 text-[10px] font-bold"
      >
        !
      </span>
      <p className="flex-1">{children}</p>
    </div>
  );
}
