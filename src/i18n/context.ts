import { createContext, useContext } from 'react';
import type { Locale } from './config';

export type LocaleControl = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

/** `use-intl` reads the locale but never changes it; the app owns that. */
export const LocaleContext = createContext<LocaleControl | null>(null);

export function useLocaleControl(): LocaleControl {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error('useLocaleControl must be used inside LocaleProvider');
  }
  return value;
}
