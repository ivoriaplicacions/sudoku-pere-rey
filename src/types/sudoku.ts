export type Language = 'ca' | 'es' | 'en';

export type ThemeId =
  | 'zen'
  | 'cyber'
  | 'cosmic'
  | 'sunset'
  | 'mediterrani'
  | 'reial'
  | 'bosc'
  | 'aurora'
  | 'pergami'
  | 'vinyes'
  | 'montroig'
  | 'montroigCamp'
  | 'cambrils'
  | 'cambrilsPort';


export interface ThemeConfig {
  id: ThemeId;
  name: { ca: string; es: string };
  bgImage: string;
  cardBg: string;
  accentColor: string;
  boardBorder: string;
  cellSelected: string;
  cellHighlight: string;
  cellError: string;
  textColor: string;
}

export interface Puzzle {
  id: string;
  level: number; // 1 to 10
  puzzleNumber: number; // 1 to 20
  initialGrid: number[][]; // 9x9, 0 for empty
  solutionGrid: number[][]; // 9x9
  givenCount: number;
}

export interface LevelInfo {
  level: number; // 1 to 10
  name: { ca: string; es: string };
  givenRange: string;
  icon: string;
  description: { ca: string; es: string };
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface CellState {
  row: number;
  col: number;
  value: number; // 0 for empty
  initialValue: number; // 0 if user-filled
  notes: Set<number>; // candidate numbers 1-9
  isError: boolean;
  isHint: boolean;
}

export interface PuzzleProgress {
  puzzleId: string;
  level: number;
  puzzleNumber: number;
  completed: boolean;
  stars: number; // 0 to 3
  bestTime: number; // seconds
  mistakes: number;
  hintsUsed: number;
}

export interface PlayerStats {
  xp: number;
  playerLevel: number;
  totalStars: number;
  puzzlesCompleted: number;
  currentStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  unlockedThemes: ThemeId[];
  unlockedAchievements: string[];
  isPremium?: boolean;
}

export interface Achievement {
  id: string;
  title: { ca: string; es: string };
  description: { ca: string; es: string };
  icon: string;
  xpReward: number;
}

export interface MoveHistory {
  row: number;
  col: number;
  prevValue: number;
  newValue: number;
  prevNotes: Set<number>;
  newNotes: Set<number>;
}
