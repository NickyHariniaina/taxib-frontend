import { useContext } from 'react';
import { AppearanceContext, type AppearanceControl } from './appearance';

export function useAppearance(): AppearanceControl {
  const value = useContext(AppearanceContext);
  if (!value) {
    throw new Error('useAppearance must be used inside AppearanceProvider');
  }
  return value;
}
