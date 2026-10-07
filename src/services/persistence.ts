import type {
  CellPosition,
  CellState,
  HistoryCellSnapshot,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isIntegerBetween(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isCellPosition(value: unknown): value is CellPosition | null {
  return (
    value === null ||
    (isRecord(value) &&
      isIntegerBetween(value.row, 0, 8) &&
      isIntegerBetween(value.col, 0, 8))
  );
}

function isNotes(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((note) => isIntegerBetween(note, 1, 9));
}

function isSerializedCell(value: unknown): value is SerializedCell {
  return (
    isRecord(value) &&
    isIntegerBetween(value.value, 0, 9) &&
    isIntegerBetween(value.initialValue, 0, 9) &&
    isNotes(value.notes) &&
    typeof value.isError === 'boolean' &&
    typeof value.isHint === 'boolean'
  );
}

function isHistoryCellSnapshot(value: unknown): value is HistoryCellSnapshot {
  return (
    isRecord(value) &&
    isIntegerBetween(value.row, 0, 8) &&
    isIntegerBetween(value.col, 0, 8) &&
    isIntegerBetween(value.value, 0, 9) &&
    isNotes(value.notes) &&
    typeof value.isError === 'boolean' &&
    typeof value.isHint === 'boolean'
  );
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  return (
    isRecord(value) &&
    Array.isArray(value.cells) &&
    value.cells.every(isHistoryCellSnapshot) &&
    isCellPosition(value.selectedCell) &&
    isNonNegativeInteger(value.hintsDelta)
  );
}

function isPuzzleProgress(value: unknown): value is PuzzleProgress {
  return (
    isRecord(value) &&
    typeof value.puzzleId === 'string' &&
    isNonNegativeInteger(value.level) &&
    isNonNegativeInteger(value.puzzleNumber) &&
    typeof value.completed === 'boolean' &&
    isIntegerBetween(value.stars, 0, 3) &&
    isNonNegativeNumber(value.bestTime) &&
    isNonNegativeInteger(value.mistakes) &&
    isNonNegativeInteger(value.hintsUsed)
  );
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
    const parsed: unknown = JSON.parse(saved);
    if (!isRecord(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(([, progress]) => isPuzzleProgress(progress)),
    ) as Record<string, PuzzleProgress>;
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
    const parsed: unknown = JSON.parse(saved);
    if (!isRecord(parsed)) return fallback;

    return {
      ...fallback,
      xp: isNonNegativeNumber(parsed.xp) ? parsed.xp : fallback.xp,
      playerLevel: isNonNegativeInteger(parsed.playerLevel)
        ? Math.max(1, parsed.playerLevel)
        : fallback.playerLevel,
      totalStars: isNonNegativeInteger(parsed.totalStars)
        ? parsed.totalStars
        : fallback.totalStars,
      puzzlesCompleted: isNonNegativeInteger(parsed.puzzlesCompleted)
        ? parsed.puzzlesCompleted
        : fallback.puzzlesCompleted,
      currentStreak: isNonNegativeInteger(parsed.currentStreak)
        ? parsed.currentStreak
        : fallback.currentStreak,
      lastPlayedDate:
        typeof parsed.lastPlayedDate === 'string' ? parsed.lastPlayedDate : fallback.lastPlayedDate,
      unlockedThemes: Array.isArray(parsed.unlockedThemes)
        ? parsed.unlockedThemes.filter(isThemeId)
        : fallback.unlockedThemes,
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements.filter((id): id is string => typeof id === 'string')
        : fallback.unlockedAchievements,
      ...(typeof parsed.isPremium === 'boolean' ? { isPremium: parsed.isPremium } : {}),
    };
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
  if (!session.board.every((row) => Array.isArray(row) && row.length === 9 && row.every(isSerializedCell))) {
    return false;
  }
  if (!isNonNegativeNumber(session.timerSeconds)) return false;
  if (!isNonNegativeInteger(session.level) || !isNonNegativeInteger(session.puzzleNumber)) {
    return false;
  }
  if (!isCellPosition(session.selectedCell) || typeof session.isNotesMode !== 'boolean') {
    return false;
  }
  if (!isNonNegativeInteger(session.mistakes) || !isNonNegativeInteger(session.hintsUsed)) {
    return false;
  }
  if (!isNonNegativeNumber(session.savedAt)) return false;
  return true;
}

export function loadSession(): InProgressSession | null {
  const saved = safeGetItem(STORAGE_KEYS.session);
  if (!saved) return null;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (!isValidSession(parsed)) return null;
    return {
      ...parsed,
      history:
        Array.isArray(parsed.history) && parsed.history.every(isHistoryEntry)
          ? parsed.history
          : [],
    };
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
