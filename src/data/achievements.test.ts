import { describe, expect, it } from 'vitest';
import type { PlayerStats, PuzzleProgress } from '../types/sudoku';
import { dateKey, techniqueForDate } from '../utils/dailyChallenge';
import {
  TECHNIQUE_MASTERY_TARGET,
  achievementProgress,
  achievementsData,
  evaluateNewAchievements,
  solvedPerTechnique,
} from './achievements';
import { LADDER, techniqueForLevel } from './ladder';

const entry = (puzzleId: string, level: number, stars = 3): PuzzleProgress => ({
  puzzleId,
  level,
  puzzleNumber: Number(/_P(\d+)/.exec(puzzleId)?.[1] ?? 1),
  completed: true,
  stars,
  bestTime: 300,
  mistakes: 1,
  hintsUsed: 1,
});

/** Every sudoku of the given levels, completed. */
function levels(from: number, to: number): Record<string, PuzzleProgress> {
  const map: Record<string, PuzzleProgress> = {};
  for (let level = from; level <= to; level++) {
    for (let n = 1; n <= 20; n++) map[`L${level}_P${n}`] = entry(`L${level}_P${n}`, level);
  }
  return map;
}

const stats = (over: Partial<PlayerStats> = {}): PlayerStats => ({
  xp: 0,
  playerLevel: 1,
  totalStars: 0,
  puzzlesCompleted: 1,
  currentStreak: 1,
  lastPlayedDate: '',
  unlockedThemes: [],
  unlockedAchievements: [],
  ...over,
});

const evaluate = (progressMap: Record<string, PuzzleProgress>, over: Partial<PlayerStats> = {}, unlocked: string[] = []) =>
  evaluateNewAchievements({
    unlocked,
    progressMap,
    stats: stats(over),
    justCompleted: { level: 1, mistakes: 1, hintsUsed: 1, time: 600 },
  }).ids;

describe('the list of achievements', () => {
  it('has unique ids, and keeps every id players may already hold', () => {
    const ids = achievementsData.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const old of ['first_win', 'no_errors', 'no_hints', 'speed_demon', 'streak_3', 'level_5_master', 'level_10_master', 'stars_30']) {
      expect(ids).toContain(old);
    }
  });

  it('has one mastery per technique on the ladder, long streaks and one per pack', () => {
    const techniques = new Set(LADDER.map((step) => step.technique));
    expect(achievementsData.filter((a) => a.id.startsWith('technique_'))).toHaveLength(techniques.size);
    expect(achievementsData.filter((a) => /^streak_(7|30|100)$/.test(a.id))).toHaveLength(3);
    expect(achievementsData.filter((a) => a.id.startsWith('pack_'))).toHaveLength(4);
  });

  it('reads well in the three languages, with nothing left unfilled', () => {
    for (const achievement of achievementsData) {
      for (const language of ['ca', 'es', 'en'] as const) {
        for (const text of [achievement.title[language], achievement.description[language]]) {
          expect(text, `${achievement.id} ${language}`).toBeTruthy();
          expect(text).not.toMatch(/[{}]|undefined|hintName|achievement[A-Z]/);
        }
      }
    }
    expect(achievementsData.find((a) => a.id === 'technique_xy-wing')?.title.es).toBe('Dominas: XY-Wing');
    expect(achievementsData.find((a) => a.id === 'pack_pack1')?.description.es).toBe('Completa los 200 sudokus del Pack Inicial');
  });

  it('no longer calls level 10 the top of the whole app', () => {
    expect(achievementsData.find((a) => a.id === 'level_10_master')?.title.es).toBe('Cima del Pack Inicial');
  });
});

describe('progress towards the long ones', () => {
  it('counts sudokus by the technique they demanded, daily challenges included', () => {
    const today = dateKey(new Date(2026, 10, 13)); // a Friday: XY-Wing
    const map = { ...levels(31, 31), [`D${today}`]: entry(`D${today}`, 0) };
    const counts = solvedPerTechnique(map);
    expect(techniqueForLevel(31)).toBe('xy-wing');
    expect(techniqueForDate(today)).toBe('xy-wing');
    expect(counts.get('xy-wing')).toBe(21);
  });

  it('ignores sudokus started but not finished', () => {
    const map = levels(1, 1);
    map.L1_P1 = { ...map.L1_P1, completed: false };
    expect(solvedPerTechnique(map).get('naked-single')).toBe(19);
  });

  it('reports how far along each long achievement is, capped at its target', () => {
    const map = levels(1, 3);
    expect(achievementProgress('technique_naked-single', map, stats())).toEqual({ current: 20, target: TECHNIQUE_MASTERY_TARGET });
    expect(achievementProgress('pack_pack1', map, stats())).toEqual({ current: 60, target: 200 });
    expect(achievementProgress('streak_30', map, stats({ currentStreak: 12 }))).toEqual({ current: 12, target: 30 });
    expect(achievementProgress('streak_7', map, stats({ currentStreak: 12 }))).toEqual({ current: 7, target: 7 });
    expect(achievementProgress('level_10_master', map, stats())).toEqual({ current: 0, target: 20 });
    expect(achievementProgress('speed_demon', map, stats())).toBeNull();
  });
});

describe('unlocking', () => {
  it('a technique is mastered at twenty sudokus, not nineteen', () => {
    const nineteen = levels(4, 4);
    delete nineteen.L4_P20;
    expect(evaluate(nineteen)).not.toContain('technique_hidden-single');
    expect(evaluate(levels(4, 4))).toContain('technique_hidden-single');
  });

  it('long streaks unlock at 7, 30 and 100 days', () => {
    expect(evaluate({}, { currentStreak: 6 })).not.toContain('streak_7');
    expect(evaluate({}, { currentStreak: 7 })).toEqual(expect.arrayContaining(['streak_3', 'streak_7']));
    expect(evaluate({}, { currentStreak: 30 })).toContain('streak_30');
    expect(evaluate({}, { currentStreak: 100 })).toContain('streak_100');
  });

  it('a pack is complete with all its sudokus, and the levels inside it unlock on the way', () => {
    const ids = evaluate(levels(1, 10));
    expect(ids).toEqual(expect.arrayContaining(['pack_pack1', 'level_5_master', 'level_10_master']));
    expect(evaluate(levels(1, 9))).not.toContain('pack_pack1');
  });

  it('never gives the same achievement twice', () => {
    expect(evaluate(levels(1, 10), {}, ['pack_pack1', 'level_10_master'])).not.toContain('pack_pack1');
  });

  it('adds up the XP of everything unlocked in one go', () => {
    const result = evaluateNewAchievements({
      unlocked: [],
      progressMap: levels(4, 4),
      stats: stats({ currentStreak: 7 }),
      justCompleted: { level: 4, mistakes: 1, hintsUsed: 1, time: 600 },
    });
    const expected = result.ids.reduce((sum, id) => sum + achievementsData.find((a) => a.id === id)!.xpReward, 0);
    expect(result.xp).toBe(expected);
    expect(result.ids).toEqual(expect.arrayContaining(['first_win', 'streak_3', 'streak_7', 'technique_hidden-single']));
  });
});
