import { useState, type ReactNode } from 'react';
import {
  ACCENTS,
  AppearanceContext,
  applyAppearance,
  detectAppearance,
  persistAccent,
  persistMode,
  type Accent,
  type Mode,
} from '../lib/appearance';

/** Owns the accent + mode choice and mirrors it onto `<html>`. */
export default function AppearanceProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(detectAppearance);
  const [accent, setAccentState] = useState<Accent>(initial.accent);
  const [mode, setModeState] = useState<Mode>(initial.mode);

  const accentColor =
    ACCENTS.find((option) => option.id === accent)?.color ?? ACCENTS[0].color;

  const setAccent = (next: Accent) => {
    setAccentState(next);
    applyAppearance(next, mode);
    persistAccent(next);
  };

  const setMode = (next: Mode) => {
    setModeState(next);
    applyAppearance(accent, next);
    persistMode(next);
  };

  return (
    <AppearanceContext.Provider
      value={{ accent, mode, accentColor, setAccent, setMode }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}
