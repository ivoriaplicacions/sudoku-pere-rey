import { beforeEach, describe, expect, it } from 'vitest';
import { CATALOGUE_VERSION, OWNED_PACKS_KEY, STORAGE_KEYS, loadCarriedStars, loadProgressMap } from './persistence';
import {
  EXPORTED_KEYS,
  PROGRESS_FILE_FORMAT,
  applyProgressFile,
  buildProgressFile,
  checkProgressFile,
  progressFileName,
} from './progressFile';

const entry = (level: number, puzzleNumber: number, stars: number) => ({
  puzzleId: `L${level}_P${puzzleNumber}`,
  level,
  puzzleNumber,
  completed: true,
  stars,
  bestTime: 200,
  mistakes: 0,
  hintsUsed: 0,
});

const STATS = { xp: 1450, playerLevel: 3, totalStars: 8, puzzlesCompleted: 3, currentStreak: 2, lastPlayedDate: '2026-11-12', unlockedThemes: [], unlockedAchievements: ['first_win'] };
const PROGRESS = { L1_P1: entry(1, 1, 3), L1_P2: entry(1, 2, 2), L1_P3: entry(1, 3, 3) };

function seedPlayer() {
  localStorage.setItem(STORAGE_KEYS.catalogue, String(CATALOGUE_VERSION));
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(PROGRESS));
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(STATS));
  localStorage.setItem(STORAGE_KEYS.theme, 'cosmic');
  localStorage.setItem(STORAGE_KEYS.language, 'ca');
  localStorage.setItem(STORAGE_KEYS.digitFirst, 'true');
  localStorage.setItem(STORAGE_KEYS.lessonsSeen, '["naked-single"]');
  localStorage.setItem(STORAGE_KEYS.session, '{"puzzleId":"L1_P4"}');
  localStorage.setItem(OWNED_PACKS_KEY, '["pack1","pack2"]');
}

const fileText = (data: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ format: PROGRESS_FILE_FORMAT, version: 1, appVersion: '2.0.0', exportedAt: 'x', data, ...extra });

beforeEach(() => localStorage.clear());

describe('exporting', () => {
  it('writes progress, stats and settings, and neither purchases nor the half-played board', () => {
    seedPlayer();
    const file = buildProgressFile(new Date('2026-11-13T10:00:00Z'));
    expect(file.format).toBe(PROGRESS_FILE_FORMAT);
    expect(file.exportedAt).toBe('2026-11-13T10:00:00.000Z');
    expect(JSON.parse(file.data[STORAGE_KEYS.progress])).toEqual(PROGRESS);
    expect(file.data[STORAGE_KEYS.theme]).toBe('cosmic');
    expect(file.data[STORAGE_KEYS.digitFirst]).toBe('true');
    expect(file.data[OWNED_PACKS_KEY]).toBeUndefined();
    expect(file.data[STORAGE_KEYS.session]).toBeUndefined();
    expect(EXPORTED_KEYS).not.toContain(OWNED_PACKS_KEY);
  });

  it('names the file after the day', () => {
    expect(progressFileName(new Date('2026-11-13T22:00:00Z'))).toBe('sudoku-king-2026-11-13.json');
  });
});

describe('a round trip', () => {
  it('exports on one device and imports on another, ending up the same', () => {
    seedPlayer();
    const text = JSON.stringify(buildProgressFile());

    localStorage.clear();
    localStorage.setItem(OWNED_PACKS_KEY, '["pack1"]');
    const check = checkProgressFile(text);
    expect(check.ok).toBe(true);
    if (!check.ok) return;
    expect(check.summary).toEqual({ puzzlesCompleted: 3, stars: 8 });

    applyProgressFile(check.data);
    expect(loadProgressMap()).toEqual(PROGRESS);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.stats)!)).toEqual(STATS);
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('cosmic');
    // Purchases on the new device are its own business, never the file's.
    expect(localStorage.getItem(OWNED_PACKS_KEY)).toBe('["pack1"]');
  });

  it('replaces what was there, and drops the half-played board', () => {
    seedPlayer();
    const text = fileText({ [STORAGE_KEYS.stats]: '{"xp":5}', [STORAGE_KEYS.catalogue]: '2' });
    const check = checkProgressFile(text);
    if (!check.ok) throw new Error('expected a valid file');
    applyProgressFile(check.data);
    expect(localStorage.getItem(STORAGE_KEYS.progress)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.session)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.stats)).toBe('{"xp":5}');
  });

  it('a file from before the regenerated puzzles goes through the usual migration', () => {
    const old = fileText({ [STORAGE_KEYS.progress]: JSON.stringify(PROGRESS), [STORAGE_KEYS.stats]: JSON.stringify(STATS) });
    const check = checkProgressFile(old);
    if (!check.ok) throw new Error('expected a valid file');
    applyProgressFile(check.data);
    // No catalogue marker: the old per-puzzle results become carried stars.
    expect(loadProgressMap()).toEqual({});
    expect(loadCarriedStars()).toBe(8);
  });
});

describe('refusing a bad file without touching anything', () => {
  beforeEach(seedPlayer);

  const before = () => JSON.stringify({ ...localStorage });

  it.each([
    ['not JSON at all', 'hello'],
    ['empty', ''],
    ['JSON from something else', '{"name":"my notes"}'],
    ['an array', '[1,2,3]'],
    ['a different format', fileText({}, { format: 'other-app' })],
  ])('%s is not a progress file', (_label, text) => {
    const snapshot = before();
    expect(checkProgressFile(text)).toEqual({ ok: false, error: 'not-a-progress-file' });
    expect(before()).toBe(snapshot);
  });

  it('a progress file cut short is damaged, not someone else’s file', () => {
    seedPlayer();
    const whole = JSON.stringify(buildProgressFile());
    const snapshot = before();
    expect(checkProgressFile(whole.slice(0, 120))).toEqual({ ok: false, error: 'damaged' });
    expect(before()).toBe(snapshot);
  });

  it('a newer file format', () => {
    expect(checkProgressFile(fileText({ [STORAGE_KEYS.stats]: '{}' }, { version: 2 }))).toEqual({
      ok: false,
      error: 'newer-version',
    });
  });

  it('progress saved against puzzles this version does not have', () => {
    const text = fileText({ [STORAGE_KEYS.stats]: '{}', [STORAGE_KEYS.catalogue]: String(CATALOGUE_VERSION + 1) });
    expect(checkProgressFile(text)).toEqual({ ok: false, error: 'newer-version' });
  });

  it.each([
    ['data missing', { format: PROGRESS_FILE_FORMAT, version: 1 }],
    ['no progress and no stats', { format: PROGRESS_FILE_FORMAT, version: 1, data: { [STORAGE_KEYS.theme]: 'zen' } }],
    ['progress that is not JSON', { format: PROGRESS_FILE_FORMAT, version: 1, data: { [STORAGE_KEYS.progress]: '{oops' } }],
    ['stats that are a list', { format: PROGRESS_FILE_FORMAT, version: 1, data: { [STORAGE_KEYS.stats]: '[1]' } }],
    ['a value that is not text', { format: PROGRESS_FILE_FORMAT, version: 1, data: { [STORAGE_KEYS.stats]: { xp: 1 } } }],
    ['a nonsense catalogue', { format: PROGRESS_FILE_FORMAT, version: 1, data: { [STORAGE_KEYS.stats]: '{}', [STORAGE_KEYS.catalogue]: 'two' } }],
  ])('a damaged file: %s', (_label, file) => {
    const snapshot = before();
    expect(checkProgressFile(JSON.stringify(file))).toEqual({ ok: false, error: 'damaged' });
    expect(before()).toBe(snapshot);
  });
});

describe('what a file cannot smuggle in', () => {
  it('ignores purchases, the session and unknown keys added by hand', () => {
    const text = fileText({
      [STORAGE_KEYS.stats]: '{"xp":1}',
      [OWNED_PACKS_KEY]: '["pack1","pack2","pack3","pack4"]',
      [STORAGE_KEYS.session]: '{"puzzleId":"L40_P20"}',
      anything_else: 'x',
    });
    const check = checkProgressFile(text);
    if (!check.ok) throw new Error('expected a valid file');
    expect(Object.keys(check.data)).toEqual([STORAGE_KEYS.stats]);

    localStorage.setItem(OWNED_PACKS_KEY, '["pack1"]');
    applyProgressFile(check.data);
    expect(localStorage.getItem(OWNED_PACKS_KEY)).toBe('["pack1"]');
    expect(localStorage.getItem('anything_else')).toBeNull();
  });

  it('strips an old premium flag from the stats', () => {
    const check = checkProgressFile(fileText({ [STORAGE_KEYS.stats]: '{"xp":1,"isPremium":true}' }));
    if (!check.ok) throw new Error('expected a valid file');
    expect(JSON.parse(check.data[STORAGE_KEYS.stats])).toEqual({ xp: 1 });
  });

  it('reads the summary safely from odd stats', () => {
    const check = checkProgressFile(fileText({ [STORAGE_KEYS.stats]: '{"puzzlesCompleted":-4,"totalStars":"lots"}' }));
    if (!check.ok) throw new Error('expected a valid file');
    expect(check.summary).toEqual({ puzzlesCompleted: 0, stars: 0 });
  });
});
