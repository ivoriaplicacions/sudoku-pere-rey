import type { Achievement, PlayerStats, PuzzleProgress } from '../types/sudoku';
import { PUZZLES_PER_LEVEL } from '../utils/sudokuLogic';

export const achievementsData: Achievement[] = [
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
    id: 'level_10_master',
    title: { ca: 'Mestre Absolut', es: 'Maestro Absoluto', en: 'Grand Master' },
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

function isLevelFullyCompleted(progressMap: Record<string, PuzzleProgress>, level: number): boolean {
  for (let puzzleNumber = 1; puzzleNumber <= PUZZLES_PER_LEVEL; puzzleNumber++) {
    if (!progressMap[`L${level}_P${puzzleNumber}`]?.completed) return false;
  }
  return true;
}

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
  if (isLevelFullyCompleted(progressMap, 5)) unlock('level_5_master');
  if (isLevelFullyCompleted(progressMap, 10)) unlock('level_10_master');
  if (stats.totalStars >= 30) unlock('stars_30');

  const xp = earned.reduce((sum, id) => {
    const achievement = achievementsData.find((item) => item.id === id);
    return sum + (achievement?.xpReward ?? 0);
  }, 0);

  return { ids: earned, xp };
}
