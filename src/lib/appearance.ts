import { createContext } from 'react';

export const ACCENT_KEY = 'taxib:accent';
export const MODE_KEY = 'taxib:mode';

export const accents = ['rouge', 'bleu', 'emeraude', 'violet', 'ambre', 'rose'] as const;
export type Accent = (typeof accents)[number];

export const modes = ['clair', 'sombre'] as const;
export type Mode = (typeof modes)[number];

/** Internal ids are French; the `data-mode` values the CSS matches on are English. */
const MODE_CSS: Record<Mode, 'light' | 'dark'> = {
  clair: 'light',
  sombre: 'dark',
};

type AccentLabelKey =
  | 'themes.rouge'
  | 'themes.bleu'
  | 'themes.emeraude'
  | 'themes.violet'
  | 'themes.ambre'
  | 'themes.rose';

type AccentOption = {
  id: Accent;
  labelKey: AccentLabelKey;
  /** Resolved hex, also handed to Leaflet which cannot read CSS variables. */
  color: string;
  /** Colour of text/icons placed on the accent. */
  ink: string;
};

export const ACCENTS: readonly AccentOption[] = [
  { id: 'rouge', labelKey: 'themes.rouge', color: '#fc3d32', ink: '#ffffff' },
  { id: 'bleu', labelKey: 'themes.bleu', color: '#3b82f6', ink: '#ffffff' },
  { id: 'emeraude', labelKey: 'themes.emeraude', color: '#10b981', ink: '#ffffff' },
  { id: 'violet', labelKey: 'themes.violet', color: '#8b5cf6', ink: '#ffffff' },
  { id: 'ambre', labelKey: 'themes.ambre', color: '#f59e0b', ink: '#1c1917' },
  { id: 'rose', labelKey: 'themes.rose', color: '#ec4899', ink: '#ffffff' },
];

export type AppearanceControl = {
  accent: Accent;
  mode: Mode;
  /** Hex of the active accent; use it where CSS variables are unavailable. */
  accentColor: string;
  setAccent: (accent: Accent) => void;
  setMode: (mode: Mode) => void;
};

export const AppearanceContext = createContext<AppearanceControl | null>(null);

function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && (accents as readonly string[]).includes(value);
}

function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && (modes as readonly string[]).includes(value);
}

export function detectAppearance(): { accent: Accent; mode: Mode } {
  let accent: Accent = 'rouge';
  let mode: Mode = 'sombre';

  try {
    const savedAccent = localStorage.getItem(ACCENT_KEY);
    if (isAccent(savedAccent)) accent = savedAccent;
    const savedMode = localStorage.getItem(MODE_KEY);
    if (isMode(savedMode)) mode = savedMode;
  } catch {
    // Storage can be blocked: fall back to the defaults.
  }

  return { accent, mode };
}

export function applyAppearance(accent: Accent, mode: Mode): void {
  const root = document.documentElement;
  root.dataset.accent = accent;
  root.dataset.mode = MODE_CSS[mode];
}

export function persistAccent(accent: Accent): void {
  try {
    localStorage.setItem(ACCENT_KEY, accent);
  } catch {
    // Best effort: the next visit simply falls back to the default.
  }
}

export function persistMode(mode: Mode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Best effort: the next visit simply falls back to the default.
  }
}

/** Applies the saved appearance before React renders, avoiding a flash. */
export function initAppearance(): void {
  const { accent, mode } = detectAppearance();
  applyAppearance(accent, mode);
}
