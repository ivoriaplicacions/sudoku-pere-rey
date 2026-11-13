import type { Achievement, PlayerStats, PuzzleProgress } from '../types/sudoku';
import type { Technique } from '../solver/humanSolver';
import { getTranslation } from '../i18n/translations';
import { dateOfDailyId, techniqueForDate } from '../utils/dailyChallenge';
import { techniqueName } from '../utils/hintExplainer';
import { LADDER, PUZZLES_PER_LEVEL, techniqueForLevel } from './ladder';
import { CONTENT_PACKS } from './packs';

/**
 * Achievements: a few that come quickly, to welcome a new player, and a longer
 * set that keeps a regular player busy for months: one per technique on the
 * ladder, long streaks, and every pack completed.
 */

const SHORT_TERM: Achievement[] = [
  {
    id: 'first_win',
    title: { ca: 'Primer Pas', es: 'Primer Paso', en: 'First Step' },
    description: {
      ca: 'Completa el teu primer Sudoku',
      es: 'Completa tu primer Sudoku',
      en: 'Complete your first Sudoku',
    },
    icon: '🏆',
    xpReward: 100,
  },
  {
    id: 'no_errors',
    title: { ca: 'Perfeccionista', es: 'Perfeccionista', en: 'Perfectionist' },
    description: {
      ca: 'Resoldre un Sudoku sense cometre cap error',
      es: 'Resolver un Sudoku sin cometer ningún error',
      en: 'Solve a Sudoku with no mistakes',
    },
    icon: '✨',
    xpReward: 150,
  },
  {
    id: 'no_hints',
    title: { ca: 'Sense Ajudes', es: 'Sin Ayudas', en: 'No Hints' },
    description: {
      ca: 'Completar un nivell 5 o superior sense usar pistes',
      es: 'Completar un nivel 5 o superior sin usar pistas',
      en: 'Complete level 5 or higher without hints',
    },
    icon: '🧠',
    xpReward: 200,
  },
  {
    id: 'speed_demon',
    title: { ca: 'Velocista', es: 'Velocista', en: 'Speedster' },
    description: {
      ca: 'Resoldre un Sudoku en menys de 3 minuts',
      es: 'Resolver un Sudoku en menos de 3 minutos',
      en: 'Solve a Sudoku in under 3 minutes',
    },
    icon: '⚡',
    xpReward: 250,
  },
  {
    id: 'streak_3',
    title: { ca: 'Constància', es: 'Constancia', en: 'Consistency' },
    description: {
      ca: 'Mantenir una ràtxa de 3 dies consecutius',
      es: 'Mantener una racha de 3 días consecutivos',
      en: 'Keep a 3-day streak',
    },
    icon: '🔥',
    xpReward: 300,
  },
  {
    id: 'level_5_master',
    title: { ca: 'Nivell Intermedi', es: 'Nivel Intermedio', en: 'Intermediate' },
    description: {
      ca: 'Completar tots els Sudokus del Nivell 5',
      es: 'Completar todos los Sudokus del Nivel 5',
      en: 'Complete every Sudoku in Level 5',
    },
    icon: '🌟',
    xpReward: 500,
  },
  {
    // The id stays: players already hold it. Level 10 used to be the hardest
    // band; on the ladder it is the top of the free pack, and the title says so.
    id: 'level_10_master',
    title: { ca: 'Cim del Pack Inicial', es: 'Cima del Pack Inicial', en: 'Top of the Starter Pack' },
    description: {
      ca: 'Completar tots els Sudokus del Nivell 10',
      es: 'Completar todos los Sudokus del Nivel 10',
      en: 'Complete every Sudoku in Level 10',
    },
    icon: '👑',
    xpReward: 1000,
  },
  {
    id: 'stars_30',
    title: { ca: 'Col·leccionista d\'Estrelles', es: 'Coleccionista de Estrellas', en: 'Star Collector' },
    description: {
      ca: 'Aconseguir 30 estrelles en total',
      es: 'Conseguir 30 estrellas en total',
      en: 'Earn 30 stars in total',
    },
    icon: '⭐',
    xpReward: 400,
  },
];

/** Sudokus a player has to solve with a technique to have mastered it. */
export const TECHNIQUE_MASTERY_TARGET = 20;

const TECHNIQUE_ICONS: Partial<Record<Technique, string>> = {
  'naked-single': '🌱',
  'hidden-single': '🔍',
  'locked-candidates': '🔒',
  'naked-pair': '👯',
  'naked-triple': '🎲',
  'hidden-pair': '🕵️',
  'x-wing': '✖️',
  'xy-wing': '🪁',
  swordfish: '🐟',
  'short-chain': '🔗',
};

const LADDER_TECHNIQUES: Technique[] = [...new Set(LADDER.map((step) => step.technique))];

const techniqueAchievementId = (technique: Technique) => `technique_${technique}`;

function trilingual(build: (language: 'ca' | 'es' | 'en') => string) {
  return { ca: build('ca'), es: build('es'), en: build('en') };
}

const TECHNIQUE_MASTERY: Achievement[] = LADDER_TECHNIQUES.map((technique) => {
  const name = (language: 'ca' | 'es' | 'en') => techniqueName(technique, language);
  return {
    id: techniqueAchievementId(technique),
    title: trilingual((language) => getTranslation(language, 'achievementMasteryTitle', { name: name(language) })),
    description: trilingual((language) =>
      getTranslation(language, 'achievementMasteryDescription', { count: TECHNIQUE_MASTERY_TARGET, name: name(language) }),
    ),
    icon: TECHNIQUE_ICONS[technique] ?? '🎓',
    xpReward: 300,
  };
});

/** Long streaks, beyond the three days of the first one. */
export const STREAK_TARGETS = [7, 30, 100] as const;

const STREAKS: Achievement[] = [
  {
    id: 'streak_7',
    title: { ca: 'Una Setmana', es: 'Una Semana', en: 'One Week' },
    description: { ca: 'Ràtxa de 7 dies seguits', es: 'Racha de 7 días seguidos', en: '7 days in a row' },
    icon: '📅',
    xpReward: 400,
  },
  {
    id: 'streak_30',
    title: { ca: 'Un Mes Sencer', es: 'Un Mes Entero', en: 'A Whole Month' },
    description: { ca: 'Ràtxa de 30 dies seguits', es: 'Racha de 30 días seguidos', en: '30 days in a row' },
    icon: '🗓️',
    xpReward: 1000,
  },
  {
    id: 'streak_100',
    title: { ca: 'Centenari', es: 'Centenario', en: 'Centurion' },
    description: { ca: 'Ràtxa de 100 dies seguits', es: 'Racha de 100 días seguidos', en: '100 days in a row' },
    icon: '💯',
    xpReward: 3000,
  },
];

const packAchievementId = (packId: string) => `pack_${packId}`;

const PACKS: Achievement[] = CONTENT_PACKS.map((pack, index) => ({
  id: packAchievementId(pack.id),
  title: trilingual((language) =>
    getTranslation(language, 'achievementPackTitle', { name: pack.name[language] ?? pack.name.es }),
  ),
  description: trilingual((language) =>
    getTranslation(language, 'achievementPackDescription', {
      count: (pack.levelEnd - pack.levelStart + 1) * PUZZLES_PER_LEVEL,
      name: pack.name[language] ?? pack.name.es,
    }),
  ),
  icon: ['🥉', '🥈', '🥇', '🏅'][index] ?? '🏅',
  xpReward: index === CONTENT_PACKS.length - 1 ? 2000 : 1000,
}));

export const achievementsData: Achievement[] = [...SHORT_TERM, ...TECHNIQUE_MASTERY, ...STREAKS, ...PACKS];

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

/** The technique a completed sudoku demanded, level or daily challenge. */
function techniqueOfEntry(entry: PuzzleProgress): Technique | null {
  const date = dateOfDailyId(entry.puzzleId);
  if (date) return techniqueForDate(date);
  if (entry.level >= 1) {
    try {
      return techniqueForLevel(entry.level);
    } catch {
      return null;
    }
  }
  return null;
}

/** Completed sudokus per technique. */
export function solvedPerTechnique(progressMap: Record<string, PuzzleProgress>): Map<Technique, number> {
  const counts = new Map<Technique, number>();
  for (const entry of Object.values(progressMap)) {
    if (!entry.completed) continue;
    const technique = techniqueOfEntry(entry);
    if (technique) counts.set(technique, (counts.get(technique) ?? 0) + 1);
  }
  return counts;
}

function completedInLevels(progressMap: Record<string, PuzzleProgress>, from: number, to: number): number {
  let count = 0;
  for (let level = from; level <= to; level++) {
    for (let puzzleNumber = 1; puzzleNumber <= PUZZLES_PER_LEVEL; puzzleNumber++) {
      if (progressMap[`L${level}_P${puzzleNumber}`]?.completed) count++;
    }
  }
  return count;
}

export interface AchievementProgress {
  current: number;
  target: number;
}

/**
 * How far a player is towards an achievement, for those that build up over
 * time. Null for the ones that happen in a single game.
 */
export function achievementProgress(
  id: string,
  progressMap: Record<string, PuzzleProgress>,
  stats: Pick<PlayerStats, 'currentStreak' | 'totalStars'>,
): AchievementProgress | null {
  const technique = LADDER_TECHNIQUES.find((candidate) => techniqueAchievementId(candidate) === id);
  if (technique) {
    const current = Math.min(solvedPerTechnique(progressMap).get(technique) ?? 0, TECHNIQUE_MASTERY_TARGET);
    return { current, target: TECHNIQUE_MASTERY_TARGET };
  }

  const streak = /^streak_(\d+)$/.exec(id);
  if (streak) {
    const target = Number(streak[1]);
    return { current: Math.min(stats.currentStreak, target), target };
  }

  const pack = CONTENT_PACKS.find((candidate) => packAchievementId(candidate.id) === id);
  if (pack) {
    const target = (pack.levelEnd - pack.levelStart + 1) * PUZZLES_PER_LEVEL;
    return { current: completedInLevels(progressMap, pack.levelStart, pack.levelEnd), target };
  }

  if (id === 'level_5_master' || id === 'level_10_master') {
    const level = id === 'level_5_master' ? 5 : 10;
    return { current: completedInLevels(progressMap, level, level), target: PUZZLES_PER_LEVEL };
  }
  if (id === 'stars_30') return { current: Math.min(stats.totalStars, 30), target: 30 };
  return null;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export function evaluateNewAchievements(params: {
  unlocked: string[];
  progressMap: Record<string, PuzzleProgress>;
  stats: PlayerStats;
  justCompleted: { level: number; mistakes: number; hintsUsed: number; time: number };
}): { ids: string[]; xp: number } {
  const { unlocked, progressMap, stats, justCompleted } = params;
  const earned: string[] = [];
  const already = new Set(unlocked);

  const unlock = (id: string) => {
    if (already.has(id) || earned.includes(id)) return;
    earned.push(id);
  };

  if (stats.puzzlesCompleted >= 1) unlock('first_win');
  if (justCompleted.mistakes === 0) unlock('no_errors');
  if (justCompleted.hintsUsed === 0 && justCompleted.level >= 5) unlock('no_hints');
  if (justCompleted.time < 180) unlock('speed_demon');
  if (stats.currentStreak >= 3) unlock('streak_3');
  if (stats.totalStars >= 30) unlock('stars_30');

  // Everything that builds up over time reaches its target the same way.
  for (const achievement of achievementsData) {
    const progress = achievementProgress(achievement.id, progressMap, stats);
    if (progress && progress.current >= progress.target) unlock(achievement.id);
  }

  const xp = earned.reduce((sum, id) => {
    const achievement = achievementsData.find((item) => item.id === id);
    return sum + (achievement?.xpReward ?? 0);
  }, 0);

  return { ids: earned, xp };
}
