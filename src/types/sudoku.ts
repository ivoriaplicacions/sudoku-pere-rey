export type Language = 'ca' | 'es' | 'en';

export type ThemeId = 'zen' | 'cyber' | 'cosmic' | 'sunset' | 'mediterrani' | 'montroig';

export interface ThemeConfig {
  id: ThemeId;
  name: { ca: string; es: string; en: string };
  /** CSS background for the app shell (gradients, no image files). */
  appBg: string;
  boardOuter: string;
  boardInner: string;
  gridMajor: string;
  gridMinor: string;
  cellIdle: string;
  cellSelected: string;
  cellHighlight: string;
  cellSame: string;
  cellError: string;
  cellHint: string;
  givenText: string;
  userText: string;
  selectedText: string;
  sameText: string;
  notesText: string;
  accentRing: string;
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
  level: number;
  name: { ca: string; es: string; en?: string };
  givenRange: string;
  icon: string;
  description: { ca: string; es: string; en?: string };
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

/** JSON-safe cell for an in-progress session. */
export interface SerializedCell {
  value: number;
  initialValue: number;
  notes: number[];
  isError: boolean;
  isHint: boolean;
}

/** One unfinished puzzle, restored when the app reopens. */
export interface InProgressSession {
  puzzleId: string;
  level: number;
  puzzleNumber: number;
  board: SerializedCell[][];
  selectedCell: CellPosition | null;
  isNotesMode: boolean;
  timerSeconds: number;
  mistakes: number;
  hintsUsed: number;
  history: HistoryEntry[];
  savedAt: number;
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
  title: { ca: string; es: string; en: string };
  description: { ca: string; es: string; en: string };
  icon: string;
  xpReward: number;
}

export interface HistoryCellSnapshot {
  row: number;
  col: number;
  value: number;
  notes: number[];
  isError: boolean;
  isHint: boolean;
}

export interface HistoryEntry {
  cells: HistoryCellSnapshot[];
  selectedCell: CellPosition | null;
  hintsDelta: number;
}
