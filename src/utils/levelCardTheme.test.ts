import { describe, expect, it } from 'vitest';
import { levelCardStyles, type LevelCardState } from './levelCardTheme';

const states = (isLight: boolean): LevelCardState[] => [
  { isLight, isUnlocked: true, needsPurchase: false },
  { isLight, isUnlocked: false, needsPurchase: true },
  { isLight, isUnlocked: false, needsPurchase: false },
];

describe('levelCardStyles', () => {
  // The bug this file exists to prevent: on a light theme the playable level was
  // dark and the locked ones were bright white, which reads exactly backwards.
  it('keeps the playable card distinct from the locked one in both worlds', () => {
    for (const isLight of [true, false]) {
      const [open, buy, locked] = states(isLight).map(levelCardStyles);
      expect(open.card).not.toBe(locked.card);
      expect(open.card).not.toBe(buy.card);
      expect(open.card).not.toContain('cursor-not-allowed');
      expect(locked.card).toContain('cursor-not-allowed');
    }
  });

  it('never dims the card a player can actually open', () => {
    for (const isLight of [true, false]) {
      expect(levelCardStyles({ isLight, isUnlocked: true, needsPurchase: false }).card).not.toMatch(
        /opacity-/,
      );
    }
  });

  it('writes dark text on light themes, whatever the card state', () => {
    for (const style of states(true).map(levelCardStyles)) {
      expect(style.title).toMatch(/text-slate-900/);
      expect(style.description).toMatch(/text-slate-\d00/);
      expect(style.title).not.toMatch(/text-white/);
    }
  });

  it('writes light text on dark themes, whatever the card state', () => {
    for (const style of states(false).map(levelCardStyles)) {
      expect(style.title).toMatch(/text-white/);
      expect(style.description).toMatch(/text-white/);
    }
  });

  it('gives a light card a light surface in every state', () => {
    for (const style of states(true).map(levelCardStyles)) {
      expect(style.card).toMatch(/bg-(white|amber-100)/);
      expect(style.card).not.toMatch(/bg-(black|slate-900)\//);
    }
  });
});
