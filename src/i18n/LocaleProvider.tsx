import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { IntlProvider } from 'use-intl';
import { detectLocale, LOCALE_KEY, messages, type Locale } from './config';
import { LocaleContext } from './context';

/** Keeps `<html lang>`, the document title and the saved choice in sync. */
export default function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = messages[locale].Meta.title;
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // Best effort: the next visit simply runs detection again.
    }
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider locale={locale} messages={messages[locale]}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}
