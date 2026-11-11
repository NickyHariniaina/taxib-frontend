const TOUR_KEY = 'taxib:tour';

/**
 * Only a finished tour is remembered. Skipping is deliberately not stored, so
 * the welcome prompt comes back on the next visit.
 */
export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === 'done';
  } catch {
    // Storage can be blocked (private mode, hardened settings): show the tour.
    return false;
  }
}

export function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_KEY, 'done');
  } catch {
    // Best effort: the next visit simply offers the tour again.
  }
}
