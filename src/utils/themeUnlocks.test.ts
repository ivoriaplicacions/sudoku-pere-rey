import { describe, expect, it } from 'vitest';
import {
  THEME_UNLOCK_STARS,
  isThemeUnlocked,
  starsUntilTheme,
  themesUnlockedBetween,
  unlockedThemeIds,
} from './themeUnlocks';
import { DEFAULT_THEME, LEGACY_DEFAULT_THEME, THEME_IDS } from '../data/themes';

describe('THEME_UNLOCK_STARS', () => {
  it('covers every theme exactly once', () => {
    expect(Object.keys(THEME_UNLOCK_STARS).sort()).toEqual([...THEME_IDS].sort());
  });

  it('never gates the theme a new install starts on', () => {
    expect(THEME_UNLOCK_STARS[DEFAULT_THEME]).toBe(0);
    expect(THEME_UNLOCK_STARS[LEGACY_DEFAULT_THEME]).toBe(0);
  });

  it('opens with a choice of both light and dark', () => {
    const free = THEME_IDS.filter((id) => THEME_UNLOCK_STARS[id] === 0);
    expect(free.length).toBeGreaterThanOrEqual(4);
  });

  it('stays reachable: every theme fits inside the stars on offer', () => {
    const maxStars = 800 * 3;
    for (const id of THEME_IDS) {
      expect(THEME_UNLOCK_STARS[id]).toBeLessThan(maxStars);
    }
  });
});

describe('isThemeUnlocked', () => {
  it('opens a theme on the exact star it asks for', () => {
    expect(isThemeUnlocked('playa', 19)).toBe(false);
    expect(isThemeUnlocked('playa', 20)).toBe(true);
  });

  // Nobody may lose a theme they already had when gating arrives.
  it('honours a previously granted theme however few stars the player has', () => {
    expect(isThemeUnlocked('montroig', 0)).toBe(false);
    expect(isThemeUnlocked('montroig', 0, ['montroig'])).toBe(true);
  });
});

describe('unlockedThemeIds', () => {
  it('starts with the free set and grows, never shrinks', () => {
    const atStart = unlockedThemeIds(0);
    const later = unlockedThemeIds(500);
    expect(atStart.length).toBe(4);
    for (const id of atStart) expect(later).toContain(id);
    expect(later.length).toBeGreaterThan(atStart.length);
  });

  it('ends up with everything', () => {
    expect(unlockedThemeIds(10_000)).toHaveLength(THEME_IDS.length);
  });

  it('includes the six themes an existing player already owned', () => {
    const owned = ['zen', 'cyber', 'cosmic', 'sunset', 'mediterrani', 'montroig'] as const;
    const unlocked = unlockedThemeIds(0, owned);
    for (const id of owned) expect(unlocked).toContain(id);
  });
});

describe('starsUntilTheme', () => {
  it('counts down and stops at zero', () => {
    expect(starsUntilTheme('playa', 0)).toBe(20);
    expect(starsUntilTheme('playa', 15)).toBe(5);
    expect(starsUntilTheme('playa', 20)).toBe(0);
    expect(starsUntilTheme('playa', 999)).toBe(0);
  });

  it('is zero for a granted theme', () => {
    expect(starsUntilTheme('montroig', 0, ['montroig'])).toBe(0);
  });
});

describe('themesUnlockedBetween', () => {
  it('names the theme earned by the stars just won', () => {
    expect(themesUnlockedBetween(18, 21)).toEqual(['playa']);
  });

  it('says nothing when no threshold was crossed', () => {
    expect(themesUnlockedBetween(21, 23)).toEqual([]);
  });

  it('says nothing when stars did not go up', () => {
    expect(themesUnlockedBetween(50, 50)).toEqual([]);
  });

  it('can report more than one at a time', () => {
    expect(themesUnlockedBetween(0, 100)).toEqual(['playa', 'cosmic', 'lavanda']);
  });
});
