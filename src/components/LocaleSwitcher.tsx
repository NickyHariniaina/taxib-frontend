import { locales, useLocale, useLocaleControl, useTranslations } from '../i18n';

/** Segmented FR / EN control; each option is pronounced in its own language. */
export default function LocaleSwitcher() {
  const locale = useLocale();
  const { setLocale } = useLocaleControl();
  const t = useTranslations('Locale');

  const names: Record<(typeof locales)[number], string> = {
    fr: t('names.fr'),
    en: t('names.en'),
  };

  return (
    <div
      role="group"
      aria-label={t('label')}
      className="flex items-center gap-0.5 rounded-lg bg-raised p-0.5 ring-1 ring-line"
    >
      {locales.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          title={names[option]}
          aria-pressed={option === locale}
          onClick={() => setLocale(option)}
          className={`rounded-md px-2 py-1 text-[11px] font-bold uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            option === locale
              ? 'bg-raised-strong text-ink-strong'
              : 'text-muted hover:text-ink-strong'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
