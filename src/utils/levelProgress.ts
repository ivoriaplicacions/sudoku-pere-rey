/** How many completed puzzles are required before a level opens (level 1 is free). */
export function completionsNeededForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * 2;
}

export function isLevelProgressUnlocked(level: number, puzzlesCompleted: number): boolean {
  return puzzlesCompleted >= completionsNeededForLevel(level);
}

/** Pack/IAP gate and sequential progress must both pass before play. */
export function canPlayLevel(
  level: number,
  puzzlesCompleted: number,
  packAccessible: boolean,
): boolean {
  return packAccessible && isLevelProgressUnlocked(level, puzzlesCompleted);
}
