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
import { DEFAULT_THEME, LEGACY_DEFAULT_THEME, isThemeId } from '../data/themes';
import { mirrorToNative } from './nativeStore';

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
  digitFirst: 'maestros_digit_first_v1',
  dailySession: 'maestros_daily_session_v1',
  lessonsSeen: 'maestros_lessons_seen_v1',
  catalogue: 'maestros_catalogue_v1',
  carriedStars: 'maestros_carried_stars_v1',
  progressArchive: 'sudoku_master_progress_catalogue1',
} as const;

/**
 * Which set of 800 puzzles the saved progress belongs to. Version 1 measured
 * difficulty by givens; version 2 is the ladder in src/data/ladder.ts. Raise it
 * whenever the puzzles behind the ids change.
 */
export const CATALOGUE_VERSION = 2;

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Where the owned packs are cached. Kept by monetization.ts; listed here so it is backed up too. */
export const OWNED_PACKS_KEY = 'maestros_owned_packs_v1';

/** Everything the native copy keeps: all of the player's data and settings. */
export const NATIVE_BACKUP_KEYS: readonly string[] = [...Object.values(STORAGE_KEYS), OWNED_PACKS_KEY];

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota / private mode
  }
  mirrorToNative(key, value);
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  mirrorToNative(key, null);
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

/** Someone who has already played has progress or stats on the device. */
function hasExistingPlayerData(): boolean {
  return safeGetItem(STORAGE_KEYS.progress) !== null || safeGetItem(STORAGE_KEYS.stats) !== null;
}

export function loadTheme(): ThemeId {
  const saved = safeGetItem(STORAGE_KEYS.theme);
  if (isThemeId(saved)) return saved;
  return hasExistingPlayerData() ? LEGACY_DEFAULT_THEME : DEFAULT_THEME;
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

/** The techniques whose lesson the player has already been shown. */
export function loadSeenLessons(): string[] {
  try {
    const parsed: unknown = JSON.parse(safeGetItem(STORAGE_KEYS.lessonsSeen) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function markLessonSeen(technique: string): void {
  const seen = loadSeenLessons();
  if (seen.includes(technique)) return;
  safeSetItem(STORAGE_KEYS.lessonsSeen, JSON.stringify([...seen, technique]));
}

/** Off unless the player turned it on: cell-first is what the app has always done. */
export function loadDigitFirst(): boolean {
  return safeGetItem(STORAGE_KEYS.digitFirst) === 'true';
}

export function saveDigitFirst(enabled: boolean): void {
  safeSetItem(STORAGE_KEYS.digitFirst, String(enabled));
}

function parseProgressMap(saved: string | null): Record<string, PuzzleProgress> {
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

/**
 * Moves a player from an older catalogue to the current one. Safe to call any
 * number of times; it only acts once.
 *
 * The ids (L3_P5) now name different puzzles, so a saved result no longer says
 * anything about the puzzle on screen, and a half-played board belongs to a
 * puzzle that is gone. Both are dropped. What the player earned is kept: the
 * stars are carried over as a total, and XP, streak, completed count, themes,
 * achievements and purchases live elsewhere and are not touched.
 *
 * The old progress is kept under another key rather than deleted, in case it is
 * ever needed to put something right.
 */
export function migrateCatalogue(): void {
  if (safeGetItem(STORAGE_KEYS.catalogue) === String(CATALOGUE_VERSION)) return;

  const oldProgress = safeGetItem(STORAGE_KEYS.progress);
  if (oldProgress !== null) {
    const earned = Object.values(parseProgressMap(oldProgress)).reduce((sum, entry) => sum + entry.stars, 0);
    safeSetItem(STORAGE_KEYS.carriedStars, String(loadCarriedStars() + earned));
    safeSetItem(STORAGE_KEYS.progressArchive, oldProgress);
    safeRemoveItem(STORAGE_KEYS.progress);
  }
  safeRemoveItem(STORAGE_KEYS.session);
  safeSetItem(STORAGE_KEYS.catalogue, String(CATALOGUE_VERSION));
}

/** Stars earned on a catalogue that has since been replaced. They still count. */
export function loadCarriedStars(): number {
  const saved = Number(safeGetItem(STORAGE_KEYS.carriedStars));
  return Number.isInteger(saved) && saved > 0 ? saved : 0;
}

export function loadProgressMap(): Record<string, PuzzleProgress> {
  migrateCatalogue();
  return parseProgressMap(safeGetItem(STORAGE_KEYS.progress));
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

/**
 * Two games can be in progress at once: one from the levels and one daily
 * challenge. Each has its own slot, so starting the day's sudoku never throws
 * away a level game halfway through, nor the other way round.
 */
export type SessionSlot = 'level' | 'daily';

const DAILY_ID = /^D\d{4}-\d{2}-\d{2}$/;

export function sessionSlotOf(puzzleId: string): SessionSlot {
  return DAILY_ID.test(puzzleId) ? 'daily' : 'level';
}

const SESSION_KEY: Record<SessionSlot, string> = {
  level: STORAGE_KEYS.session,
  daily: STORAGE_KEYS.dailySession,
};

export function loadSession(slot: SessionSlot = 'level'): InProgressSession | null {
  migrateCatalogue();
  const saved = safeGetItem(SESSION_KEY[slot]);
  if (!saved) return null;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (!isValidSession(parsed)) return null;
    // A game is only ever read back from its own slot.
    if (sessionSlotOf(parsed.puzzleId) !== slot) return null;
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

/** Saves the game into the slot its puzzle belongs to. */
export function saveSession(session: InProgressSession): void {
  safeSetItem(SESSION_KEY[sessionSlotOf(session.puzzleId)], JSON.stringify(session));
}

export function clearSession(slot: SessionSlot = 'level'): void {
  safeRemoveItem(SESSION_KEY[slot]);
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
