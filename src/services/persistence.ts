import type {
  CellPosition,
  CellState,
  HistoryEntry,
  InProgressSession,
  Language,
  PlayerStats,
  PuzzleProgress,
  SerializedCell,
  ThemeId,
} from '../types/sudoku';
import { DEFAULT_THEME, isThemeId } from '../data/themes';

export const STORAGE_KEYS = {
  progress: 'sudoku_master_progress_v1',
  stats: 'sudoku_master_stats_v1',
  language: 'maestros_language_v1',
  haptics: 'maestros_haptics_v1',
  introSeen: 'maestros_intro_seen_v1',
  session: 'maestros_session_v1',
  theme: 'maestros_theme_v1',
  sound: 'maestros_sound_v1',
  autoCheck: 'maestros_autocheck_v1',
} as const;

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota / private mode
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function hasSeenIntro(): boolean {
  return safeGetItem(STORAGE_KEYS.introSeen) === 'true';
}

export function markIntroSeen(): void {
  safeSetItem(STORAGE_KEYS.introSeen, 'true');
}

export function loadLanguage(): Language {
  const saved = safeGetItem(STORAGE_KEYS.language);
  if (saved === 'ca' || saved === 'es' || saved === 'en') return saved;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith('ca')) return 'ca';
  if (browser.startsWith('es')) return 'es';
  return 'en';
}

export function saveLanguage(lang: Language): void {
  safeSetItem(STORAGE_KEYS.language, lang);
}

export function loadHapticsEnabled(): boolean {
  return safeGetItem(STORAGE_KEYS.haptics) !== 'false';
}

export function saveHapticsEnabled(enabled: boolean): void {
  safeSetItem(STORAGE_KEYS.haptics, String(enabled));
}

export function loadTheme(): ThemeId {
  const saved = safeGetItem(STORAGE_KEYS.theme);
  return isThemeId(saved) ? saved : DEFAULT_THEME;
}

export function saveTheme(theme: ThemeId): void {
  safeSetItem(STORAGE_KEYS.theme, theme);
}

export function loadSoundEnabled(): boolean {
  return safeGetItem(STORAGE_KEYS.sound) !== 'false';
}

export function saveSoundEnabled(enabled: boolean): void {
  safeSetItem(STORAGE_KEYS.sound, String(enabled));
}

export function loadAutoCheckErrors(): boolean {
  return safeGetItem(STORAGE_KEYS.autoCheck) !== 'false';
}

export function saveAutoCheckErrors(enabled: boolean): void {
  safeSetItem(STORAGE_KEYS.autoCheck, String(enabled));
}

export function loadProgressMap(): Record<string, PuzzleProgress> {
  const saved = safeGetItem(STORAGE_KEYS.progress);
  if (!saved) return {};
  try {
    return JSON.parse(saved) as Record<string, PuzzleProgress>;
  } catch {
    return {};
  }
}

export function saveProgressMap(progressMap: Record<string, PuzzleProgress>): void {
  safeSetItem(STORAGE_KEYS.progress, JSON.stringify(progressMap));
}

export function loadPlayerStats(fallback: PlayerStats): PlayerStats {
  const saved = safeGetItem(STORAGE_KEYS.stats);
  if (!saved) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(saved) as PlayerStats) };
  } catch {
    return fallback;
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  safeSetItem(STORAGE_KEYS.stats, JSON.stringify(stats));
}

export function serializeBoard(board: CellState[][]): SerializedCell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      value: cell.value,
      initialValue: cell.initialValue,
      notes: [...cell.notes],
      isError: cell.isError,
      isHint: cell.isHint,
    })),
  );
}

export function deserializeBoard(rows: SerializedCell[][]): CellState[][] {
  return rows.map((row, r) =>
    row.map((cell, c) => ({
      row: r,
      col: c,
      value: cell.value,
      initialValue: cell.initialValue,
      notes: new Set(cell.notes),
      isError: cell.isError,
      isHint: cell.isHint,
    })),
  );
}

function isValidSession(raw: unknown): raw is InProgressSession {
  if (!raw || typeof raw !== 'object') return false;
  const session = raw as InProgressSession;
  if (typeof session.puzzleId !== 'string' || !session.puzzleId) return false;
  if (!Array.isArray(session.board) || session.board.length !== 9) return false;
  if (!session.board.every((row) => Array.isArray(row) && row.length === 9)) return false;
  if (typeof session.timerSeconds !== 'number' || session.timerSeconds < 0) return false;
  return true;
}

export function loadSession(): InProgressSession | null {
  const saved = safeGetItem(STORAGE_KEYS.session);
  if (!saved) return null;
  try {
    const parsed: unknown = JSON.parse(saved);
    return isValidSession(parsed)
      ? { ...parsed, history: Array.isArray(parsed.history) ? parsed.history : [] }
      : null;
  } catch {
    return null;
  }
}

export function saveSession(session: InProgressSession): void {
  safeSetItem(STORAGE_KEYS.session, JSON.stringify(session));
}

export function clearSession(): void {
  safeRemoveItem(STORAGE_KEYS.session);
}

export function buildSession(params: {
  puzzleId: string;
  level: number;
  puzzleNumber: number;
  board: CellState[][];
  selectedCell: CellPosition | null;
  isNotesMode: boolean;
  timerSeconds: number;
  mistakes: number;
  hintsUsed: number;
  history?: HistoryEntry[];
}): InProgressSession {
  return {
    puzzleId: params.puzzleId,
    level: params.level,
    puzzleNumber: params.puzzleNumber,
    board: serializeBoard(params.board),
    selectedCell: params.selectedCell,
    isNotesMode: params.isNotesMode,
    timerSeconds: params.timerSeconds,
    mistakes: params.mistakes,
    hintsUsed: params.hintsUsed,
    history: params.history ?? [],
    savedAt: Date.now(),
  };
}
