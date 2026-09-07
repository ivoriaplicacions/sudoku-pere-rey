import { getPackForLevel } from '../data/packs';

/** How many completed puzzles are required before a level opens (level 1 is free). */
export function completionsNeededForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * 2;
}

export function isLevelProgressUnlocked(level: number, puzzlesCompleted: number): boolean {
  return puzzlesCompleted >= completionsNeededForLevel(level);
}

/**
 * Sequential progress only gates the free pack. Paying for a pack opens its ten
 * levels straight away: charging for content the player still cannot reach would be
 * a misleading omission (art. 7 Directive 2005/29/EC, art. 5 TRLGDCU) and the fastest
 * route to refunds.
 */
export function requiresProgressGate(level: number): boolean {
  const pack = getPackForLevel(level);
  return !pack || pack.priceEur === 0;
}

/** Pack/IAP gate first; sequential progress only where it still applies. */
export function canPlayLevel(
  level: number,
  puzzlesCompleted: number,
  packAccessible: boolean,
): boolean {
  if (!packAccessible) return false;
  if (!requiresProgressGate(level)) return true;
  return isLevelProgressUnlocked(level, puzzlesCompleted);
}
