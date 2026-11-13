import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestReview = vi.fn().mockResolvedValue(undefined);
let native = true;
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native } }));
vi.mock('@capawesome/capacitor-app-review', () => ({ AppReview: { requestReview: () => requestReview() } }));

const { REVIEW_INTERVAL_DAYS, loadLastReviewAsk, maybeAskForReview, shouldAskForReview } = await import('./reviewPrompt');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 13, 18);

beforeEach(() => {
  localStorage.clear();
  native = true;
  requestReview.mockClear();
  vi.useFakeTimers();
});

describe('when to ask for a rating', () => {
  const ask = (over: Partial<Parameters<typeof shouldAskForReview>[0]>) =>
    shouldAskForReview({ stars: 3, puzzlesCompleted: 5, lastAskedAt: null, now: NOW, ...over });

  it('after a three-star win from the fifth sudoku on', () => {
    expect(ask({})).toBe(true);
    expect(ask({ puzzlesCompleted: 40 })).toBe(true);
  });

  it('never before the fifth sudoku', () => {
    expect(ask({ puzzlesCompleted: 4 })).toBe(false);
  });

  it('never after a win with fewer than three stars', () => {
    expect(ask({ stars: 2 })).toBe(false);
  });

  it('at most once every 120 days', () => {
    expect(ask({ lastAskedAt: NOW - (REVIEW_INTERVAL_DAYS - 1) * DAY })).toBe(false);
    expect(ask({ lastAskedAt: NOW - REVIEW_INTERVAL_DAYS * DAY })).toBe(true);
  });
});

describe('asking', () => {
  it('opens the store’s dialog a moment after the win, and remembers it asked', async () => {
    expect(maybeAskForReview(3, 5, NOW)).toBe(true);
    expect(requestReview).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);
    expect(requestReview).toHaveBeenCalledTimes(1);
    expect(loadLastReviewAsk()).toBe(NOW);
  });

  it('does not ask twice in a row', async () => {
    maybeAskForReview(3, 5, NOW);
    expect(maybeAskForReview(3, 6, NOW + DAY)).toBe(false);
    await vi.advanceTimersByTimeAsync(2000);
    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it('never asks on the web, where there is no store', () => {
    native = false;
    expect(maybeAskForReview(3, 50, NOW)).toBe(false);
    expect(loadLastReviewAsk()).toBeNull();
  });

  it('a store that declines is not an error', async () => {
    requestReview.mockRejectedValueOnce(new Error('not available'));
    maybeAskForReview(3, 5, NOW);
    await expect(vi.advanceTimersByTimeAsync(2000)).resolves.not.toThrow();
  });
});
