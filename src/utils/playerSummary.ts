import type { PlayerStats, PuzzleProgress, ThemeId } from '../types/sudoku';
import { CONTENT_PACKS } from '../data/packs';
import { PUZZLES_PER_LEVEL } from './sudokuLogic';
import { unlockedThemeIds } from './themeUnlocks';
import { THEME_IDS } from '../data/themes';

export interface PackSummary {
  packId: string;
  completed: number;
  total: number;
  stars: number;
  maxStars: number;
}

export interface PlayerSummary {
  puzzlesCompleted: number;
  puzzlesTotal: number;
  totalStars: number;
  maxStars: number;
  perfectPuzzles: number;
  flawlessPuzzles: number;
  bestTime: number | null;
  averageTime: number | null;
  currentStreak: number;
  xp: number;
  playerLevel: number;
  themesUnlocked: number;
  themesTotal: number;
  packs: PackSummary[];
}

const STARS_PER_PUZZLE = 3;

/**
 * Everything the app already records, gathered in one place. The numbers were all
 * being kept and none of them were ever shown.
 */
export function summarisePlayer(
  stats: PlayerStats,
  progressMap: Record<string, PuzzleProgress>,
): PlayerSummary {
  const entries = Object.values(progressMap).filter((entry) => entry.completed);

  let bestTime: number | null = null;
  let timeSum = 0;
  let timeCount = 0;
  let perfectPuzzles = 0;
  let flawlessPuzzles = 0;

  for (const entry of entries) {
    if (entry.bestTime > 0) {
      bestTime = bestTime === null ? entry.bestTime : Math.min(bestTime, entry.bestTime);
      timeSum += entry.bestTime;
      timeCount++;
    }
    if (entry.stars >= STARS_PER_PUZZLE) perfectPuzzles++;
    if (entry.mistakes === 0 && entry.hintsUsed === 0) flawlessPuzzles++;
  }

  const packs: PackSummary[] = CONTENT_PACKS.map((pack) => {
    const levels = pack.levelEnd - pack.levelStart + 1;
    const inPack = entries.filter(
      (entry) => entry.level >= pack.levelStart && entry.level <= pack.levelEnd,
    );
    return {
      packId: pack.id,
      completed: inPack.length,
      total: levels * PUZZLES_PER_LEVEL,
      stars: inPack.reduce((sum, entry) => sum + entry.stars, 0),
      maxStars: levels * PUZZLES_PER_LEVEL * STARS_PER_PUZZLE,
    };
  });

  const puzzlesTotal = packs.reduce((sum, pack) => sum + pack.total, 0);

  return {
    puzzlesCompleted: stats.puzzlesCompleted,
    puzzlesTotal,
    totalStars: stats.totalStars,
    maxStars: puzzlesTotal * STARS_PER_PUZZLE,
    perfectPuzzles,
    flawlessPuzzles,
    bestTime,
    averageTime: timeCount > 0 ? Math.round(timeSum / timeCount) : null,
    currentStreak: stats.currentStreak,
    xp: stats.xp,
    playerLevel: stats.playerLevel,
    themesUnlocked: unlockedThemeIds(stats.totalStars, stats.unlockedThemes as ThemeId[]).length,
    themesTotal: THEME_IDS.length,
    packs,
  };
}

/** mm:ss, or a dash when there is nothing to show yet. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds < 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
