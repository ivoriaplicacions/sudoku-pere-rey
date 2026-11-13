import { generateForTechnique } from '../solver/generator';
import type { Technique } from '../solver/humanSolver';
import type { Language, Puzzle } from '../types/sudoku';

/**
 * The daily challenge: one sudoku per date, the same for everyone.
 *
 * There is no server. The puzzle is generated on the device from the date, and
 * the generator gives the same puzzle for the same seed on any device, so two
 * players on the same day get the same board. It is generated the first time
 * it is asked for and kept in memory after that.
 *
 * Dates are the player's own calendar day, as YYYY-MM-DD.
 */

/** Daily puzzles belong to no level. */
export const DAILY_LEVEL = 0;

const DAILY_PREFIX = 'D';

/**
 * Which technique each day of the week asks for, Sunday first. Only techniques
 * the generator finds quickly: a phone builds the puzzle while the player waits.
 * Friday and Saturday reach into the paid packs, a taste of what they hold.
 */
export const DAILY_TECHNIQUES: readonly Technique[] = [
  'naked-pair', // Sunday
  'hidden-single', // Monday
  'locked-candidates', // Tuesday
  'naked-pair', // Wednesday
  'locked-candidates', // Thursday
  'xy-wing', // Friday
  'short-chain', // Saturday
];

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The player's calendar day, as YYYY-MM-DD. */
export function dateKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseKey(key: string): { year: number; month: number; day: number } {
  const match = DATE_PATTERN.exec(key);
  if (!match) throw new Error(`Not a date: "${key}"`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** 0 for Sunday to 6 for Saturday, the same wherever the player is. */
export function weekdayOf(key: string): number {
  const { year, month, day } = parseKey(key);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function techniqueForDate(key: string): Technique {
  return DAILY_TECHNIQUES[weekdayOf(key)];
}

export function dailyPuzzleId(key: string): string {
  return `${DAILY_PREFIX}${key}`;
}

/** The date of a daily puzzle id, or null for any other puzzle. */
export function dateOfDailyId(id: string): string | null {
  if (!id.startsWith(DAILY_PREFIX)) return null;
  const key = id.slice(DAILY_PREFIX.length);
  return DATE_PATTERN.test(key) ? key : null;
}

/** A stable number from the date: the generator's seed. FNV-1a. */
export function seedForDate(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash % 1_000_000) + 1;
}

function toGrid(digits: string): number[][] {
  return Array.from({ length: 9 }, (_, row) => Array.from(digits.slice(row * 9, row * 9 + 9), Number));
}

const cache = new Map<string, Puzzle>();

/**
 * The daily puzzle for a date. If, against all odds, the day's technique does
 * not turn up, the day falls back to hidden singles, which always do.
 */
export function dailyPuzzle(key: string): Puzzle {
  const cached = cache.get(key);
  if (cached) return cached;

  const seed = seedForDate(key);
  let technique = techniqueForDate(key);
  let made = generateForTechnique(technique, seed, { minPerUnit: 2, maxAttempts: 3000 });
  if (!made) {
    technique = 'hidden-single';
    made = generateForTechnique(technique, seed, { minPerUnit: 2, maxAttempts: 3000 });
  }
  if (!made) throw new Error(`No daily puzzle for ${key}`);

  const puzzle: Puzzle = {
    id: dailyPuzzleId(key),
    level: DAILY_LEVEL,
    puzzleNumber: parseKey(key).day,
    initialGrid: toGrid(made.puzzle),
    solutionGrid: toGrid(made.solution),
    givenCount: made.givens,
    daily: { date: key, technique },
  };
  cache.set(key, puzzle);
  return puzzle;
}

const LOCALES: Record<Language, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };

/** "13 nov." / "13 Nov": the day as the player's language writes it. */
export function formatDay(key: string, language: Language): string {
  const { year, month, day } = parseKey(key);
  return new Intl.DateTimeFormat(LOCALES[language], { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

/** "Novembre de 2026" / "Noviembre de 2026" / "November 2026": only the first letter capitalised. */
export function formatMonth(year: number, month: number, language: Language): string {
  const text = new Intl.DateTimeFormat(LOCALES[language], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
  return text.charAt(0).toLocaleUpperCase(LOCALES[language]) + text.slice(1);
}

/** Monday-first initials of the weekdays: "dl. dt. …", "L M X …", "M T W …". */
export function weekdayInitials(language: Language): string[] {
  const format = new Intl.DateTimeFormat(LOCALES[language], { weekday: 'narrow', timeZone: 'UTC' });
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) => format.format(new Date(Date.UTC(2024, 0, 1 + i))));
}

export interface CalendarDay {
  key: string;
  day: number;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * The days of the month `today` falls in, with the weekday the month starts on
 * (0 = Monday, as calendars in Spain show it) so a grid can be laid out.
 */
export function monthCalendar(today: string): { firstWeekday: number; days: CalendarDay[]; year: number; month: number } {
  const { year, month } = parseKey(today);
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstSundayBased = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days: CalendarDay[] = [];
  for (let day = 1; day <= length; day++) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({ key, day, isToday: key === today, isFuture: key > today });
  }
  return { firstWeekday: (firstSundayBased + 6) % 7, days, year, month };
}
