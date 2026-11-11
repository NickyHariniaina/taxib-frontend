import type { Locale } from './config';
import type fr from './messages/fr';

declare module 'use-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof fr;
  }
}
