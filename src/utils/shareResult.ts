import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { buildLevelList } from '../data/levels';
import { localized } from '../i18n/localized';
import { getTranslation } from '../i18n/translations';
import type { Language, Puzzle } from '../types/sudoku';
import { PRODUCT_LEGAL_URL } from '../version';
import { formatDay } from './dailyChallenge';

/**
 * The message a player sends after a win: what they solved, the stars and the
 * time, and where to find the app. It says nothing about the player, and the
 * board itself is not shared.
 */

const LEVELS = buildLevelList();

export function formatResultTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function starsText(stars: number): string {
  const earned = Math.max(0, Math.min(3, stars));
  return '★'.repeat(earned) + '☆'.repeat(3 - earned);
}

export function resultMessage(
  puzzle: Pick<Puzzle, 'level' | 'daily'>,
  result: { stars: number; time: number },
  language: Language,
): string {
  const params = { stars: starsText(result.stars), time: formatResultTime(result.time) };
  const line = puzzle.daily
    ? getTranslation(language, 'shareDaily', { ...params, date: formatDay(puzzle.daily.date, language) })
    : getTranslation(language, 'shareLevel', {
        ...params,
        level: puzzle.level,
        technique: localized(LEVELS[puzzle.level - 1]?.name ?? { ca: '', es: '' }, language),
      });
  return `${line}\n${PRODUCT_LEGAL_URL}`;
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/** The system share sheet on a phone; the browser's own, or the clipboard, on the web. */
export async function shareResult(text: string): Promise<ShareOutcome> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ text });
      return 'shared';
    }
    if (typeof navigator.share === 'function') {
      await navigator.share({ text });
      return 'shared';
    }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (error) {
    const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
    return /cancel|abort/i.test(message) ? 'cancelled' : 'failed';
  }
}
