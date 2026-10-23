import { describe, expect, it } from 'vitest';
import { puzzleCardStyles, type PuzzleCardState } from './puzzleCardTheme';

const states = (isLight: boolean): PuzzleCardState[] => [
  { isLight, isInProgress: true, isCompleted: false },
  { isLight, isInProgress: false, isCompleted: true },
  { isLight, isInProgress: false, isCompleted: false },
];

describe('puzzleCardStyles', () => {
  it('keeps the three states apart in both worlds', () => {
    for (const isLight of [true, false]) {
      const cards = states(isLight).map((s) => puzzleCardStyles(s).card);
      expect(new Set(cards).size).toBe(3);
    }
  });

  it('puts dark text on a light card, whatever its state', () => {
    for (const style of states(true).map(puzzleCardStyles)) {
      expect(style.number).toBe('text-slate-900');
      expect(style.footer).toMatch(/text-slate-\d00/);
      expect(style.givenPill).not.toMatch(/text-white/);
    }
  });

  it('puts light text on a dark card, whatever its state', () => {
    for (const style of states(false).map(puzzleCardStyles)) {
      expect(style.number).toBe('text-white');
      expect(style.footer).toMatch(/text-white/);
    }
  });

  // The dark emerald card on a pale background was the thing that looked wrong.
  it('never paints a near-black card on a light theme', () => {
    for (const style of states(true).map(puzzleCardStyles)) {
      expect(style.card).not.toMatch(/bg-\w+-9\d0\//);
    }
  });

  it('keeps the dark theme exactly as it shipped', () => {
    expect(puzzleCardStyles({ isLight: false, isInProgress: false, isCompleted: true }).card).toContain(
      'bg-emerald-950/40',
    );
  });
});
