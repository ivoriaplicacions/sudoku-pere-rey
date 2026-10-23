import { describe, expect, it } from 'vitest';
import { formatDuration, summarisePlayer } from './playerSummary';
import { CONTENT_PACKS } from '../data/packs';
import { THEME_IDS } from '../data/themes';
import type { PlayerStats, PuzzleProgress } from '../types/sudoku';

const stats = (over: Partial<PlayerStats> = {}): PlayerStats => ({
  xp: 0,
  playerLevel: 1,
  totalStars: 0,
  puzzlesCompleted: 0,
  currentStreak: 0,
  lastPlayedDate: '',
  unlockedThemes: [],
  unlockedAchievements: [],
  ...over,
});

const done = (over: Partial<PuzzleProgress> = {}): PuzzleProgress => ({
  puzzleId: 'L1_P1',
  level: 1,
  puzzleNumber: 1,
  completed: true,
  stars: 3,
  bestTime: 120,
  mistakes: 0,
  hintsUsed: 0,
  ...over,
});

describe('summarisePlayer', () => {
  it('reports an empty profile without inventing numbers', () => {
    const summary = summarisePlayer(stats(), {});
    expect(summary.puzzlesCompleted).toBe(0);
    expect(summary.bestTime).toBeNull();
    expect(summary.averageTime).toBeNull();
    expect(summary.perfectPuzzles).toBe(0);
  });

  it('counts the whole catalogue as the denominator', () => {
    const summary = summarisePlayer(stats(), {});
    const expected = CONTENT_PACKS.length * 10 * 20;
    expect(summary.puzzlesTotal).toBe(expected);
    expect(summary.maxStars).toBe(expected * 3);
  });

  it('ignores puzzles that were started but not finished', () => {
    const summary = summarisePlayer(stats(), {
      a: done(),
      b: done({ puzzleId: 'L1_P2', completed: false, bestTime: 10 }),
    });
    expect(summary.bestTime).toBe(120);
    expect(summary.perfectPuzzles).toBe(1);
  });

  it('takes the fastest time and the mean of the rest', () => {
    const summary = summarisePlayer(stats(), {
      a: done({ bestTime: 100 }),
      b: done({ puzzleId: 'L1_P2', bestTime: 300 }),
    });
    expect(summary.bestTime).toBe(100);
    expect(summary.averageTime).toBe(200);
  });

  it('separates a three-star solve from a clean one', () => {
    const summary = summarisePlayer(stats(), {
      a: done({ stars: 3, mistakes: 2, hintsUsed: 1 }),
      b: done({ puzzleId: 'L1_P2', stars: 1, mistakes: 0, hintsUsed: 0 }),
    });
    expect(summary.perfectPuzzles).toBe(1);
    expect(summary.flawlessPuzzles).toBe(1);
  });

  it('files each puzzle under the pack its level belongs to', () => {
    const paid = CONTENT_PACKS.find((pack) => pack.priceEur > 0)!;
    const summary = summarisePlayer(stats(), {
      a: done({ level: 1 }),
      b: done({ puzzleId: 'x', level: paid.levelStart }),
    });
    const free = summary.packs.find((pack) => pack.packId === CONTENT_PACKS[0].id)!;
    const bought = summary.packs.find((pack) => pack.packId === paid.id)!;
    expect(free.completed).toBe(1);
    expect(bought.completed).toBe(1);
    expect(free.stars).toBe(3);
  });

  it('counts themes the player can actually use', () => {
    expect(summarisePlayer(stats(), {}).themesUnlocked).toBe(4);
    expect(summarisePlayer(stats({ totalStars: 10_000 }), {}).themesUnlocked).toBe(
      THEME_IDS.length,
    );
    expect(summarisePlayer(stats(), {}).themesTotal).toBe(THEME_IDS.length);
  });

  it('honours themes an existing player already had', () => {
    const summary = summarisePlayer(stats({ unlockedThemes: ['montroig'] }), {});
    expect(summary.themesUnlocked).toBe(5);
  });
});

describe('formatDuration', () => {
  it('pads to mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(600)).toBe('10:00');
  });

  it('shows a dash when there is nothing yet', () => {
    expect(formatDuration(null)).toBe('--:--');
    expect(formatDuration(-1)).toBe('--:--');
  });

  it('keeps counting past an hour rather than wrapping', () => {
    expect(formatDuration(3725)).toBe('62:05');
  });
});
