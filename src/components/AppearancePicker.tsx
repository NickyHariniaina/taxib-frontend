import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ACCENTS, modes, type Accent } from '../lib/appearance';
import { useAppearance } from '../lib/useAppearance';
import { useTranslations } from '../i18n';
import { SectionLabel } from './ui';

/** Accent swatches + light/dark switch, shown at the bottom of the drawer. */
export default function AppearancePicker() {
  const t = useTranslations('Appearance');
  const { accent, mode, setAccent, setMode } = useAppearance();

  const onSwatchKeyDown = (
    e: ReactKeyboardEvent<HTMLButtonElement>,
    id: Accent,
  ) => {
    if (
      e.key !== 'ArrowRight' &&
      e.key !== 'ArrowDown' &&
      e.key !== 'ArrowLeft' &&
      e.key !== 'ArrowUp'
    ) {
      return;
    }
    e.preventDefault();
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const index = ACCENTS.findIndex((option) => option.id === id);
    const next = ACCENTS[(index + step + ACCENTS.length) % ACCENTS.length];
    setAccent(next.id);
    document.getElementById(`accent-${next.id}`)?.focus();
  };

  return (
    <section className="space-y-2">
      <SectionLabel>{t('section')}</SectionLabel>

      <div className="space-y-3 rounded-2xl bg-raised px-3 py-3 ring-1 ring-line">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] font-medium text-muted">{t('mode')}</span>
          <div
            role="group"
            aria-label={t('modeLabel')}
            className="grid grid-cols-2 gap-0.5 rounded-lg bg-canvas/50 p-0.5 ring-1 ring-line"
          >
            {modes.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  mode === option
                    ? 'bg-raised-strong text-ink-strong shadow-sm'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {t(option)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] font-medium text-muted">{t('color')}</span>
          <div
            role="radiogroup"
            aria-label={t('colorLabel')}
            className="flex items-center gap-2"
          >
            {ACCENTS.map((option) => {
              const selected = accent === option.id;
              return (
                <button
                  key={option.id}
                  id={`accent-${option.id}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={t(option.labelKey)}
                  title={t(option.labelKey)}
                  onClick={() => setAccent(option.id)}
                  onKeyDown={(e) => onSwatchKeyDown(e, option.id)}
                  style={{ backgroundColor: option.color, color: option.ink }}
                  className={`grid h-6 w-6 place-items-center rounded-full ring-1 ring-line transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-panel ${
                    selected
                      ? 'ring-2 ring-ink-strong/60 ring-offset-2 ring-offset-panel'
                      : 'hover:scale-110'
                  }`}
                >
                  {selected && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-3 w-3"
                    >
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
