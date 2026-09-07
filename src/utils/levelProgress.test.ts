import { describe, expect, it } from 'vitest';
import {
  canPlayLevel,
  completionsNeededForLevel,
  isLevelProgressUnlocked,
  requiresProgressGate,
} from './levelProgress';
import { CONTENT_PACKS } from '../data/packs';

const FREE_PACK = CONTENT_PACKS.find((pack) => pack.priceEur === 0)!;
const PAID_PACK = CONTENT_PACKS.find((pack) => pack.priceEur > 0)!;
const LAST_PAID_LEVEL = CONTENT_PACKS[CONTENT_PACKS.length - 1].levelEnd;

describe('completionsNeededForLevel', () => {
  it('opens the first level to a brand new player', () => {
    expect(completionsNeededForLevel(1)).toBe(0);
  });

  it('asks for two more completions per level', () => {
    expect(completionsNeededForLevel(2)).toBe(2);
    expect(completionsNeededForLevel(3)).toBe(4);
    expect(completionsNeededForLevel(10)).toBe(18);
  });

  it('never asks for a negative number below level 1', () => {
    expect(completionsNeededForLevel(0)).toBe(0);
    expect(completionsNeededForLevel(-5)).toBe(0);
  });
});

describe('isLevelProgressUnlocked', () => {
  it('unlocks exactly at the threshold, not one short', () => {
    expect(isLevelProgressUnlocked(3, 3)).toBe(false);
    expect(isLevelProgressUnlocked(3, 4)).toBe(true);
    expect(isLevelProgressUnlocked(3, 5)).toBe(true);
  });
});

describe('requiresProgressGate', () => {
  it('gates the free pack', () => {
    for (let level = FREE_PACK.levelStart; level <= FREE_PACK.levelEnd; level++) {
      expect(requiresProgressGate(level)).toBe(true);
    }
  });

  it('does not gate any paid pack', () => {
    for (const pack of CONTENT_PACKS.filter((p) => p.priceEur > 0)) {
      for (let level = pack.levelStart; level <= pack.levelEnd; level++) {
        expect(requiresProgressGate(level)).toBe(false);
      }
    }
  });

  it('treats a level outside every pack as gated rather than open', () => {
    expect(requiresProgressGate(LAST_PAID_LEVEL + 1)).toBe(true);
  });
});

describe('canPlayLevel', () => {
  it('refuses a pack the player does not own, however far they have got', () => {
    expect(canPlayLevel(PAID_PACK.levelStart, 10_000, false)).toBe(false);
  });

  it('keeps the free pack sequential', () => {
    expect(canPlayLevel(1, 0, true)).toBe(true);
    expect(canPlayLevel(5, 0, true)).toBe(false);
    expect(canPlayLevel(5, 8, true)).toBe(true);
  });

  // The regression this whole change exists to prevent: paying for a pack and
  // still finding it locked behind dozens of puzzles.
  it('opens every level of a purchased pack immediately', () => {
    for (const pack of CONTENT_PACKS.filter((p) => p.priceEur > 0)) {
      for (let level = pack.levelStart; level <= pack.levelEnd; level++) {
        expect(canPlayLevel(level, 0, true)).toBe(true);
      }
    }
  });

  it('opens the very last level to a buyer who has completed nothing', () => {
    expect(canPlayLevel(LAST_PAID_LEVEL, 0, true)).toBe(true);
  });
});
