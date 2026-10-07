import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORAGE_KEYS,
  buildSession,
  clearSession,
  deserializeBoard,
  loadLanguage,
  loadPlayerStats,
  loadProgressMap,
  loadSession,
  loadTheme,
  safeGetItem,
  safeSetItem,
  saveSession,
  serializeBoard,
} from './persistence';
import { DEFAULT_THEME } from '../data/themes';
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
