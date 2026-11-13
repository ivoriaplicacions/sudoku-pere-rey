/**
 * Asking for a rating, with each store's own dialog.
 *
 * Only after a three-star win, never before the fifth completed sudoku, and at
 * most once every 120 days. The stores add their own limits on top (Apple
 * shows the dialog at most three times a year, Google decides whether to show
 * it at all), so the app can only ever ask; it never knows the answer and
 * never nags.
 *
 * The plan asks for this to come only once the game keeps its promise: asking
 * for reviews while it did not would invite bad ones.
 */
import { Capacitor } from '@capacitor/core';
import { AppReview } from '@capawesome/capacitor-app-review';
import { STORAGE_KEYS, safeGetItem, safeSetItem } from './persistence';

export const REVIEW_MIN_COMPLETED = 5;
export const REVIEW_INTERVAL_DAYS = 120;

const DAY_MS = 24 * 60 * 60 * 1000;

export function shouldAskForReview(params: {
  stars: number;
  puzzlesCompleted: number;
  lastAskedAt: number | null;
  now: number;
}): boolean {
  if (params.stars < 3) return false;
  if (params.puzzlesCompleted < REVIEW_MIN_COMPLETED) return false;
  if (params.lastAskedAt !== null && params.now - params.lastAskedAt < REVIEW_INTERVAL_DAYS * DAY_MS) return false;
  return true;
}

export function loadLastReviewAsk(): number | null {
  const saved = Number(safeGetItem(STORAGE_KEYS.reviewAskedAt));
  return Number.isFinite(saved) && saved > 0 ? saved : null;
}

/**
 * Called after a win. Waits for the victory screen to settle, then asks if
 * the moment is right. Does nothing on the web, where there is no store.
 */
export function maybeAskForReview(stars: number, puzzlesCompleted: number, now = Date.now()): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  if (!shouldAskForReview({ stars, puzzlesCompleted, lastAskedAt: loadLastReviewAsk(), now })) return false;

  // Recorded before asking: whether or not the store shows the dialog, the app
  // does not ask again for a while.
  safeSetItem(STORAGE_KEYS.reviewAskedAt, String(now));
  setTimeout(() => {
    AppReview.requestReview().catch(() => {
      // No store on the device, or the store declined: nothing to do.
    });
  }, 1500);
  return true;
}
