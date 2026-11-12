/**
 * The difficulty ladder: what each of the 40 levels demands.
 *
 * One climb from level 1 to level 40, instead of four packs repeating the same
 * ten bands. Every puzzle of a level needs exactly the technique listed here as
 * its hardest step: the generator builds them that way and `puzzles:verify`
 * fails the build if one does not.
 *
 * Quads and hidden triples are not on the ladder. Aimed generation turned up no
 * quad in 6,000 grids and one hidden triple in 3,000, far too few to fill levels.
 *
 * Self-contained on purpose: the Node scripts import this file directly.
 */
import type { Technique } from '../solver/humanSolver';

export interface LadderStep {
  /** First and last level of the step, both included. */
  from: number;
  to: number;
  technique: Technique;
  /**
   * Givens every puzzle of the step has. Only the single techniques use it, to
   * make the first levels gentler. Without it the puzzle keeps as few givens as
   * the technique allows.
   */
  givens?: number;
  /** Fewest givens allowed in any row, column or box. */
  minPerUnit: number;
}

export const PUZZLES_PER_LEVEL = 20;

export const LADDER: readonly LadderStep[] = [
  // Pack I, free
  { from: 1, to: 1, technique: 'naked-single', givens: 50, minPerUnit: 4 },
  { from: 2, to: 2, technique: 'naked-single', givens: 46, minPerUnit: 4 },
  { from: 3, to: 3, technique: 'naked-single', givens: 42, minPerUnit: 3 },
  { from: 4, to: 4, technique: 'hidden-single', givens: 38, minPerUnit: 3 },
  { from: 5, to: 5, technique: 'hidden-single', givens: 34, minPerUnit: 3 },
  { from: 6, to: 6, technique: 'hidden-single', givens: 30, minPerUnit: 2 },
  { from: 7, to: 10, technique: 'locked-candidates', minPerUnit: 2 },
  // Pack II
  { from: 11, to: 13, technique: 'naked-pair', minPerUnit: 2 },
  { from: 14, to: 16, technique: 'naked-triple', minPerUnit: 2 },
  { from: 17, to: 20, technique: 'hidden-pair', minPerUnit: 2 },
  // Pack III
  { from: 21, to: 30, technique: 'x-wing', minPerUnit: 2 },
  // Pack IV
  { from: 31, to: 33, technique: 'xy-wing', minPerUnit: 2 },
  { from: 34, to: 36, technique: 'swordfish', minPerUnit: 2 },
  { from: 37, to: 40, technique: 'short-chain', minPerUnit: 2 },
];

export const LEVEL_COUNT = LADDER[LADDER.length - 1].to;

export function ladderStepForLevel(level: number): LadderStep {
  const step = LADDER.find((candidate) => level >= candidate.from && level <= candidate.to);
  if (!step) throw new Error(`Level ${level} is not on the ladder`);
  return step;
}

export function techniqueForLevel(level: number): Technique {
  return ladderStepForLevel(level).technique;
}
