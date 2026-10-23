import type { ThemeId } from '../types/sudoku';
import { THEME_IDS } from '../data/themes';

/**
 * Stars needed before a theme can be chosen. Four are free from the first launch,
 * two dark and two light, so nobody starts in a world they dislike; the rest are
 * earned. PlayerStats already carried an `unlockedThemes` field that nothing ever
 * read — this is what it was for.
 *
 * A level holds 20 puzzles worth 3 stars each, so 20 stars is roughly seven clean
 * solves and the first unlock lands well inside the free pack.
 */
export const THEME_UNLOCK_STARS: Record<ThemeId, number> = {
  zen: 0,
  cyber: 0,
  alba: 0,
  prado: 0,
  playa: 20,
  cosmic: 45,
  lavanda: 80,
  sunset: 130,
  citrus: 200,
  mediterrani: 300,
  aurora: 430,
  montroig: 600,
};

/**
 * `granted` is a floor, never a ceiling: players from before the themes were
 * gated keep everything they already had, and an unlock is never taken back.
 */
export function isThemeUnlocked(
  themeId: ThemeId,
  totalStars: number,
  granted: readonly ThemeId[] = [],
): boolean {
  return totalStars >= THEME_UNLOCK_STARS[themeId] || granted.includes(themeId);
}

export function unlockedThemeIds(
  totalStars: number,
  granted: readonly ThemeId[] = [],
): ThemeId[] {
  return THEME_IDS.filter((id) => isThemeUnlocked(id, totalStars, granted));
}

/** Stars still missing, or 0 once the theme is available. */
export function starsUntilTheme(
  themeId: ThemeId,
  totalStars: number,
  granted: readonly ThemeId[] = [],
): number {
  if (isThemeUnlocked(themeId, totalStars, granted)) return 0;
  return THEME_UNLOCK_STARS[themeId] - totalStars;
}

/** Themes that just became available, cheapest first, for announcing the moment. */
export function themesUnlockedBetween(
  previousStars: number,
  currentStars: number,
  granted: readonly ThemeId[] = [],
): ThemeId[] {
  if (currentStars <= previousStars) return [];
  return THEME_IDS.filter(
    (id) =>
      !isThemeUnlocked(id, previousStars, granted) && isThemeUnlocked(id, currentStars, granted),
  ).sort((a, b) => THEME_UNLOCK_STARS[a] - THEME_UNLOCK_STARS[b]);
}
