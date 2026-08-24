import type { PlayerStats } from '../types/sudoku';

export function localDateStamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftLocalDate(stamp: string, days: number): string {
  const [year, month, day] = stamp.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDateStamp(date);
}

/** Updates the daily streak when the player actually plays. */
export function applyDailyStreak(stats: PlayerStats): PlayerStats {
  const today = localDateStamp();
  if (stats.lastPlayedDate === today) return stats;

  const yesterday = shiftLocalDate(today, -1);
  const currentStreak = stats.lastPlayedDate === yesterday ? stats.currentStreak + 1 : 1;

  return {
    ...stats,
    currentStreak,
    lastPlayedDate: today,
  };
}
