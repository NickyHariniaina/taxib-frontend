import type fr from './messages/fr';

/** Drops literal types (and `readonly`) so other locales can hold different strings. */
type Widen<T> = {
  -readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** Structural shape every locale catalog must satisfy. */
export type MessageShape = Widen<typeof fr>;

/** Notices are stored as keys, so they re-translate when the locale changes. */
export type ErrorKey =
  | 'Errors.stops'
  | 'Errors.lines'
  | 'Errors.routeNotFound'
  | 'Errors.routeUnavailable'
  | 'Errors.gpsDenied'
  | 'Errors.gpsUnsupported'
  | 'Errors.gpsUnavailable';
