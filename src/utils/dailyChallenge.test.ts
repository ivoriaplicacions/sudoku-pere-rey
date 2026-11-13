import { describe, expect, it } from 'vitest';
import { solveWithTechniques } from '../solver/humanSolver';
import {
  DAILY_LEVEL,
  DAILY_TECHNIQUES,
  dailyPuzzle,
  dailyPuzzleId,
  dateKey,
  dateOfDailyId,
  formatDay,
  formatMonth,
  monthCalendar,
  weekdayInitials,
  seedForDate,
  techniqueForDate,
  weekdayOf,
} from './dailyChallenge';

const flat = (grid: number[][]) => grid.flat().join('');

describe('dates', () => {
  it('uses the player’s own calendar day', () => {
    expect(dateKey(new Date(2026, 10, 13, 23, 59))).toBe('2026-11-13');
    expect(dateKey(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
  });

  it('knows the weekday of a date wherever the player is', () => {
    expect(weekdayOf('2026-11-13')).toBe(5); // a Friday
    expect(weekdayOf('2026-11-15')).toBe(0); // a Sunday
  });

  it('round-trips a daily id, and refuses other ids', () => {
    expect(dateOfDailyId(dailyPuzzleId('2026-11-13'))).toBe('2026-11-13');
    expect(dateOfDailyId('L3_P5')).toBeNull();
    expect(dateOfDailyId('Dnonsense')).toBeNull();
  });

  it('gives each date its own seed', () => {
    const seeds = new Set(Array.from({ length: 60 }, (_, i) => seedForDate(dateKey(new Date(2026, 0, 1 + i)))));
    expect(seeds.size).toBe(60);
  });
});

describe('the daily puzzle', { timeout: 60_000 }, () => {
  it('is the same every time for the same date: the same for everyone', () => {
    const first = dailyPuzzle('2026-11-13');
    // Built again from scratch, not from the cache.
    const again = solveWithTechniques(flat(first.initialGrid));
    expect(again.grid.join('')).toBe(flat(first.solutionGrid));
    expect(dailyPuzzle('2026-11-13')).toBe(first);
  });

  it('is a different puzzle on a different day', () => {
    expect(flat(dailyPuzzle('2026-11-14').initialGrid)).not.toBe(flat(dailyPuzzle('2026-11-13').initialGrid));
  });

  it.each(['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21'])(
    '%s demands exactly the technique of its weekday',
    (key) => {
      const puzzle = dailyPuzzle(key);
      const result = solveWithTechniques(flat(puzzle.initialGrid));
      expect(result.status).toBe('solved');
      expect(result.hardest).toBe(techniqueForDate(key));
      expect(result.grid.join('')).toBe(flat(puzzle.solutionGrid));
      expect(puzzle.daily).toEqual({ date: key, technique: techniqueForDate(key) });
    },
  );

  it('belongs to no level and is numbered by the day of the month', () => {
    const puzzle = dailyPuzzle('2026-11-13');
    expect(puzzle.level).toBe(DAILY_LEVEL);
    expect(puzzle.puzzleNumber).toBe(13);
    expect(puzzle.id).toBe('D2026-11-13');
    expect(puzzle.givenCount).toBe(flat(puzzle.initialGrid).replace(/0/g, '').length);
  });

  it('rotates through a technique for every day of the week', () => {
    expect(DAILY_TECHNIQUES).toHaveLength(7);
  });
});

describe('dates in words', () => {
  it('capitalises only the first letter of the month', () => {
    expect(formatMonth(2026, 11, 'es')).toBe('Noviembre de 2026');
    // Catalan writes "de" or "del" before the year depending on the runtime's locale data.
    expect(formatMonth(2026, 11, 'ca')).toMatch(/^Novembre del? 2026$/);
    expect(formatMonth(2026, 11, 'en')).toBe('November 2026');
  });

  it('writes a short day and seven weekday initials, Monday first', () => {
    expect(formatDay('2026-11-13', 'es')).toMatch(/^13 nov/);
    expect(weekdayInitials('en')).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  });
});

describe('the month calendar', () => {
  it('lays out November 2026, which starts on a Sunday', () => {
    const month = monthCalendar('2026-11-13');
    expect(month.days).toHaveLength(30);
    expect(month.firstWeekday).toBe(6); // Monday-first grid: Sunday is the last column
    expect(month.days.find((day) => day.isToday)?.day).toBe(13);
    expect(month.days.filter((day) => day.isFuture).map((day) => day.day)[0]).toBe(14);
    expect(month.days.filter((day) => !day.isFuture)).toHaveLength(13);
  });

  it('knows the length of February in a leap year', () => {
    expect(monthCalendar('2028-02-10').days).toHaveLength(29);
    expect(monthCalendar('2027-02-10').days).toHaveLength(28);
  });
});
