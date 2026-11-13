/**
 * The player's progress as a file they can keep, move to another phone, or use
 * to put things back after reinstalling.
 *
 * The file holds progress, stats and settings. It never holds purchases: if it
 * did, editing it would unlock paid packs. Purchases always come back from the
 * store, with "Restore purchases".
 *
 * Importing replaces what is on the device. The file is checked first, and a
 * file from a newer version of the app, a damaged one, or anything that is not a
 * progress file at all is refused without touching the player's data.
 */
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { APP_VERSION } from '../version';
import { CATALOGUE_VERSION, STORAGE_KEYS, safeGetItem, safeRemoveItem, safeSetItem } from './persistence';

export const PROGRESS_FILE_FORMAT = 'sudoku-king-progress';
export const PROGRESS_FILE_VERSION = 1;

/** What goes in the file. Not the half-played board, and never the purchases. */
export const EXPORTED_KEYS: readonly string[] = [
  STORAGE_KEYS.progress,
  STORAGE_KEYS.stats,
  STORAGE_KEYS.carriedStars,
  STORAGE_KEYS.catalogue,
  STORAGE_KEYS.progressArchive,
  STORAGE_KEYS.lessonsSeen,
  STORAGE_KEYS.theme,
  STORAGE_KEYS.language,
  STORAGE_KEYS.haptics,
  STORAGE_KEYS.sound,
  STORAGE_KEYS.autoCheck,
  STORAGE_KEYS.digitFirst,
  STORAGE_KEYS.introSeen,
];

/** Keys whose value is JSON and has to parse to an object. */
const JSON_OBJECT_KEYS: readonly string[] = [STORAGE_KEYS.progress, STORAGE_KEYS.stats];

export interface ProgressFile {
  format: typeof PROGRESS_FILE_FORMAT;
  version: number;
  appVersion: string;
  exportedAt: string;
  data: Record<string, string>;
}

export interface ProgressSummary {
  puzzlesCompleted: number;
  stars: number;
}

export type ImportCheck =
  | { ok: true; data: Record<string, string>; summary: ProgressSummary }
  | { ok: false; error: 'not-a-progress-file' | 'newer-version' | 'damaged' };

/** The file's contents, from what is on the device now. */
export function buildProgressFile(now: Date = new Date()): ProgressFile {
  const data: Record<string, string> = {};
  for (const key of EXPORTED_KEYS) {
    const value = safeGetItem(key);
    if (value !== null) data[key] = value;
  }
  return {
    format: PROGRESS_FILE_FORMAT,
    version: PROGRESS_FILE_VERSION,
    appVersion: APP_VERSION,
    exportedAt: now.toISOString(),
    data,
  };
}

export function progressFileName(now: Date = new Date()): string {
  return `sudoku-king-${now.toISOString().slice(0, 10)}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function summarise(data: Record<string, string>): ProgressSummary {
  try {
    const stats: unknown = data[STORAGE_KEYS.stats] ? JSON.parse(data[STORAGE_KEYS.stats]) : {};
    const record = isRecord(stats) ? stats : {};
    const count = (value: unknown) => (typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0);
    return { puzzlesCompleted: count(record.puzzlesCompleted), stars: count(record.totalStars) };
  } catch {
    return { puzzlesCompleted: 0, stars: 0 };
  }
}

/** Checks a file's text before anything on the device is touched. */
export function checkProgressFile(text: string): ImportCheck {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // A progress file cut short or edited badly still names its format: call it damaged.
    return { ok: false, error: text.includes(PROGRESS_FILE_FORMAT) ? 'damaged' : 'not-a-progress-file' };
  }
  if (!isRecord(parsed) || parsed.format !== PROGRESS_FILE_FORMAT) {
    return { ok: false, error: 'not-a-progress-file' };
  }
  if (typeof parsed.version !== 'number' || parsed.version > PROGRESS_FILE_VERSION) {
    return { ok: false, error: 'newer-version' };
  }
  if (!isRecord(parsed.data)) return { ok: false, error: 'damaged' };

  // Only keys the app knows, and only text: anything else in the file is ignored.
  const data: Record<string, string> = {};
  for (const key of EXPORTED_KEYS) {
    const value = parsed.data[key];
    if (value === undefined) continue;
    if (typeof value !== 'string') return { ok: false, error: 'damaged' };
    data[key] = value;
  }
  if (data[STORAGE_KEYS.progress] === undefined && data[STORAGE_KEYS.stats] === undefined) {
    return { ok: false, error: 'damaged' };
  }

  const catalogue = data[STORAGE_KEYS.catalogue];
  if (catalogue !== undefined) {
    const number = Number(catalogue);
    if (!Number.isInteger(number) || number < 1) return { ok: false, error: 'damaged' };
    // Saved against puzzles this version of the app does not have.
    if (number > CATALOGUE_VERSION) return { ok: false, error: 'newer-version' };
  }

  for (const key of JSON_OBJECT_KEYS) {
    if (data[key] === undefined) continue;
    try {
      const value: unknown = JSON.parse(data[key]);
      if (!isRecord(value)) return { ok: false, error: 'damaged' };
      if (key === STORAGE_KEYS.stats && 'isPremium' in value) {
        // A leftover flag from an old version; ownership only ever comes from the store.
        const { isPremium: _ignored, ...rest } = value;
        void _ignored;
        data[key] = JSON.stringify(rest);
      }
    } catch {
      return { ok: false, error: 'damaged' };
    }
  }

  return { ok: true, data, summary: summarise(data) };
}

/**
 * Replaces the device's progress and settings with the file's. The caller
 * reloads the app afterwards so every screen reads the new data.
 *
 * A file without a catalogue marker predates the regenerated puzzles; leaving
 * the marker out makes the usual migration run on it at the next start.
 */
export function applyProgressFile(data: Record<string, string>): void {
  for (const key of EXPORTED_KEYS) safeRemoveItem(key);
  // The half-played board belonged to the progress being replaced.
  safeRemoveItem(STORAGE_KEYS.session);
  for (const [key, value] of Object.entries(data)) safeSetItem(key, value);
}

export type ExportResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

/**
 * Hands the file to the player: the system share sheet on a phone (save to
 * Files, Drive, send by mail...), a download on the web.
 */
export async function exportProgress(now: Date = new Date()): Promise<ExportResult> {
  const text = JSON.stringify(buildProgressFile(now), null, 2);
  const name = progressFileName(now);

  if (Capacitor.isNativePlatform()) {
    try {
      const { uri } = await Filesystem.writeFile({
        path: name,
        data: text,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({ title: name, files: [uri] });
      return 'shared';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return /cancel/i.test(message) ? 'cancelled' : 'failed';
    }
  }

  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
