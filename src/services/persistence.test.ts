import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CATALOGUE_VERSION,
  STORAGE_KEYS,
  buildSession,
  clearSession,
  deserializeBoard,
  loadCarriedStars,
  loadLanguage,
  loadPlayerStats,
  loadProgressMap,
  loadSession,
  loadTheme,
  migrateCatalogue,
  safeGetItem,
  safeSetItem,
  saveProgressMap,
  saveSession,
  sessionSlotOf,
  serializeBoard,
} from './persistence';
import { DEFAULT_THEME, LEGACY_DEFAULT_THEME } from '../data/themes';
import type { CellState, PlayerStats } from '../types/sudoku';

const cell = (row: number, col: number, value = 0, notes: number[] = []): CellState => ({
  row,
  col,
  value,
  initialValue: 0,
  notes: new Set(notes),
  isError: false,
  isHint: false,
});

const board = (): CellState[][] =>
  Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => cell(r, c)));

const validSession = () =>
  buildSession({
    puzzleId: 'L1_P1',
    level: 1,
    puzzleNumber: 1,
    board: board(),
    selectedCell: null,
    isNotesMode: false,
    timerSeconds: 42,
    mistakes: 0,
    hintsUsed: 0,
  });

beforeEach(() => {
  localStorage.clear();
  // A player already on the current catalogue; the migration has its own tests.
  localStorage.setItem(STORAGE_KEYS.catalogue, String(CATALOGUE_VERSION));
});

const progressEntry = (level: number, puzzleNumber: number, stars: number) => ({
  puzzleId: `L${level}_P${puzzleNumber}`,
  level,
  puzzleNumber,
  completed: true,
  stars,
  bestTime: 200,
  mistakes: 0,
  hintsUsed: 0,
});

describe('moving to a new catalogue', () => {
  const oldProgress = { L1_P1: progressEntry(1, 1, 3), L1_P2: progressEntry(1, 2, 2) };

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEYS.catalogue);
  });

  it('drops the per-puzzle results, which now name other puzzles', () => {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(oldProgress));
    expect(loadProgressMap()).toEqual({});
    expect(localStorage.getItem(STORAGE_KEYS.progress)).toBeNull();
  });

  it('carries the stars over as a total', () => {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(oldProgress));
    migrateCatalogue();
    expect(loadCarriedStars()).toBe(5);
  });

  it('keeps the old progress under another key instead of deleting it', () => {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(oldProgress));
    migrateCatalogue();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.progressArchive)!)).toEqual(oldProgress);
  });

  it('drops a half-played board, whose puzzle no longer exists', () => {
    saveSession(validSession());
    expect(loadSession()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
  });

  it('leaves stats, settings and purchases alone', () => {
    const stats = JSON.stringify({ xp: 900, totalStars: 5, puzzlesCompleted: 2, currentStreak: 4 });
    localStorage.setItem(STORAGE_KEYS.stats, stats);
    localStorage.setItem(STORAGE_KEYS.language, 'ca');
    localStorage.setItem('some_other_key', 'kept');
    migrateCatalogue();
    expect(localStorage.getItem(STORAGE_KEYS.stats)).toBe(stats);
    expect(localStorage.getItem(STORAGE_KEYS.language)).toBe('ca');
    expect(localStorage.getItem('some_other_key')).toBe('kept');
  });

  it('acts once: progress earned afterwards survives the next launch', () => {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(oldProgress));
    migrateCatalogue();
    const fresh = { L1_P1: progressEntry(1, 1, 1) };
    saveProgressMap(fresh);
    saveSession(validSession());

    migrateCatalogue();
    expect(loadProgressMap()).toEqual(fresh);
    expect(loadSession()?.puzzleId).toBe('L1_P1');
    expect(loadCarriedStars()).toBe(5);
  });

  it('survives corrupt old progress, carrying nothing', () => {
    localStorage.setItem(STORAGE_KEYS.progress, '{oops');
    expect(loadProgressMap()).toEqual({});
    expect(loadCarriedStars()).toBe(0);
    expect(localStorage.getItem(STORAGE_KEYS.catalogue)).toBe(String(CATALOGUE_VERSION));
  });

  it('does nothing to a fresh install beyond marking the catalogue', () => {
    migrateCatalogue();
    expect(loadCarriedStars()).toBe(0);
    expect(localStorage.getItem(STORAGE_KEYS.progressArchive)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.catalogue)).toBe(String(CATALOGUE_VERSION));
  });

  it('ignores a carried total that is not a whole positive number', () => {
    localStorage.setItem(STORAGE_KEYS.carriedStars, 'lots');
    expect(loadCarriedStars()).toBe(0);
    localStorage.setItem(STORAGE_KEYS.carriedStars, '-3');
    expect(loadCarriedStars()).toBe(0);
  });
});

describe('safe storage wrappers', () => {
  it('returns null instead of throwing when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: storage disabled');
    });
    expect(safeGetItem('anything')).toBeNull();
  });

  it('swallows a quota error on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => safeSetItem('k', 'v')).not.toThrow();
  });
});

describe('two saved games, in separate slots', () => {
  const dailySession = () =>
    buildSession({
      puzzleId: 'D2026-11-13',
      level: 0,
      puzzleNumber: 13,
      board: board(),
      selectedCell: null,
      isNotesMode: false,
      timerSeconds: 7,
      mistakes: 0,
      hintsUsed: 0,
    });

  it('tells the daily challenge from a level game by its id', () => {
    expect(sessionSlotOf('D2026-11-13')).toBe('daily');
    expect(sessionSlotOf('L1_P1')).toBe('level');
    expect(sessionSlotOf('Dsomething')).toBe('level');
  });

  it('keeps each game in its own slot, so one never overwrites the other', () => {
    saveSession(validSession());
    saveSession(dailySession());
    expect(loadSession('level')?.puzzleId).toBe('L1_P1');
    expect(loadSession('daily')?.puzzleId).toBe('D2026-11-13');
    expect(loadSession()?.puzzleId).toBe('L1_P1');
  });

  it('clears one slot without touching the other', () => {
    saveSession(validSession());
    saveSession(dailySession());
    clearSession('daily');
    expect(loadSession('daily')).toBeNull();
    expect(loadSession('level')?.puzzleId).toBe('L1_P1');
  });

  it('never reads a game back from the wrong slot', () => {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(dailySession()));
    expect(loadSession('level')).toBeNull();
  });
});

describe('loadSession', () => {
  it('restores a session it wrote itself', () => {
    saveSession(validSession());
    const loaded = loadSession();
    expect(loaded?.puzzleId).toBe('L1_P1');
    expect(loaded?.timerSeconds).toBe(42);
    expect(loaded?.history).toEqual([]);
  });

  it('returns null when nothing is stored', () => {
    expect(loadSession()).toBeNull();
  });

  it.each([
    ['not JSON at all', 'to be continued'],
    ['a JSON primitive', '"just a string"'],
    ['null', 'null'],
    ['an object with no puzzle id', JSON.stringify({ board: [], timerSeconds: 0 })],
    ['a board that is not 9 rows', JSON.stringify({ puzzleId: 'x', board: [[]], timerSeconds: 0 })],
    ['a negative timer', JSON.stringify({ puzzleId: 'x', board: Array(9).fill(Array(9).fill({})), timerSeconds: -1 })],
  ])('rejects %s rather than crashing the app', (_label, raw) => {
    localStorage.setItem(STORAGE_KEYS.session, raw);
    expect(loadSession()).toBeNull();
  });

  it('rejects a structurally correct session with malformed cell data', () => {
    const malformed = JSON.parse(JSON.stringify(validSession())) as {
      board: Array<Array<Record<string, unknown>>>;
    };
    malformed.board[0][0].value = 'not a digit';
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(malformed));

    expect(loadSession()).toBeNull();
  });

  it('drops malformed history instead of restoring unsafe entries', () => {
    const malformed = JSON.parse(JSON.stringify(validSession())) as { history: unknown[] };
    malformed.history = [{ cells: [{ row: 99 }] }];
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(malformed));

    expect(loadSession()?.history).toEqual([]);
  });

  it('tolerates a session saved before history existed', () => {
    const { history: _history, ...withoutHistory } = validSession();
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(withoutHistory));
    expect(loadSession()?.history).toEqual([]);
  });

  it('forgets the session when cleared', () => {
    saveSession(validSession());
    clearSession();
    expect(loadSession()).toBeNull();
  });
});

describe('board serialisation', () => {
  it('survives a round trip with notes intact', () => {
    const original = board();
    original[4][4] = cell(4, 4, 0, [1, 5, 9]);
    original[0][0] = cell(0, 0, 7);

    const restored = deserializeBoard(serializeBoard(original));

    expect(restored[0][0].value).toBe(7);
    expect([...restored[4][4].notes].sort()).toEqual([1, 5, 9]);
    expect(restored[8][8].row).toBe(8);
    expect(restored[8][8].col).toBe(8);
  });

  it('rebuilds notes as a Set, not an array', () => {
    const original = board();
    original[1][1] = cell(1, 1, 0, [3]);
    expect(deserializeBoard(serializeBoard(original))[1][1].notes).toBeInstanceOf(Set);
  });
});

describe('settings fall back rather than break', () => {
  // The light themes shipped with a new default. Flipping a player who has been
  // using the dark one for weeks is a change they did not ask for.
  it('keeps the old dark default for someone who has already played', () => {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify({ L1_P1: { completed: true } }));
    expect(loadTheme()).toBe(LEGACY_DEFAULT_THEME);
  });

  it('keeps the old default when only stats exist', () => {
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({ xp: 10 }));
    expect(loadTheme()).toBe(LEGACY_DEFAULT_THEME);
  });

  it('gives a fresh install the new light default', () => {
    expect(loadTheme()).toBe(DEFAULT_THEME);
  });

  it('still prefers a theme the player chose, however long they have played', () => {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify({ L1_P1: { completed: true } }));
    localStorage.setItem(STORAGE_KEYS.theme, 'cosmic');
    expect(loadTheme()).toBe('cosmic');
  });

  it('uses the default theme for an unknown value', () => {
    localStorage.setItem(STORAGE_KEYS.theme, 'neon-hologram');
    expect(loadTheme()).toBe(DEFAULT_THEME);
  });

  it('keeps a theme it recognises', () => {
    localStorage.setItem(STORAGE_KEYS.theme, 'cyber');
    expect(loadTheme()).toBe('cyber');
  });

  it('follows the browser language when nothing is stored', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ca-ES');
    expect(loadLanguage()).toBe('ca');
  });

  it('falls back to English for an unsupported browser language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
    expect(loadLanguage()).toBe('en');
  });

  it('prefers the stored language over the browser', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
    localStorage.setItem(STORAGE_KEYS.language, 'es');
    expect(loadLanguage()).toBe('es');
  });

  it('returns an empty progress map for corrupt data', () => {
    localStorage.setItem(STORAGE_KEYS.progress, '{oops');
    expect(loadProgressMap()).toEqual({});
  });

  it('keeps valid progress entries and ignores malformed ones', () => {
    localStorage.setItem(
      STORAGE_KEYS.progress,
      JSON.stringify({
        valid: {
          puzzleId: 'L1_P1',
          level: 1,
          puzzleNumber: 1,
          completed: true,
          stars: 3,
          bestTime: 120,
          mistakes: 0,
          hintsUsed: 0,
        },
        malformed: { puzzleId: 'L1_P2', stars: 'three' },
      }),
    );

    expect(loadProgressMap()).toEqual({
      valid: expect.objectContaining({ puzzleId: 'L1_P1', stars: 3 }),
    });
  });

  it('merges stored stats over the defaults so new fields survive an upgrade', () => {
    const fallback = { xp: 0, level: 1, streak: 0, puzzlesCompleted: 0 } as unknown as PlayerStats;
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify({ xp: 500 }));
    expect(loadPlayerStats(fallback)).toMatchObject({ xp: 500, puzzlesCompleted: 0 });
  });

  it('keeps defaults when stored stats contain invalid types', () => {
    const fallback: PlayerStats = {
      xp: 0,
      playerLevel: 1,
      totalStars: 0,
      puzzlesCompleted: 0,
      currentStreak: 0,
      lastPlayedDate: '',
      unlockedThemes: ['zen'],
      unlockedAchievements: [],
    };
    localStorage.setItem(
      STORAGE_KEYS.stats,
      JSON.stringify({
        xp: '500',
        playerLevel: -4,
        unlockedThemes: ['cyber', 'unknown-theme'],
        unlockedAchievements: ['first_win', 42],
      }),
    );

    expect(loadPlayerStats(fallback)).toMatchObject({
      xp: 0,
      playerLevel: 1,
      unlockedThemes: ['cyber'],
      unlockedAchievements: ['first_win'],
    });
  });
});
