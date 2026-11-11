import en from './messages/en';
import fr from './messages/fr';

export const LOCALE_KEY = 'taxib:lang';
export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

// `en` is checked against `MessageShape` in its own file. The cast only
// bridges the literal string types that `fr` carries (`as const`), which the
// provider needs so ICU arguments stay typed at call sites.
export const messages: Record<Locale, typeof fr> = {
  fr,
  en: en as unknown as typeof fr,
};

function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' &&
    (locales as readonly string[]).includes(value)
  );
}

/** Saved choice first, then the browser's preferences, then French. */
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode, hardened settings).
  }

  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }

  return defaultLocale;
}
