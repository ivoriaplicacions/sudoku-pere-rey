/**
 * Builds a sudoku that demands one specific technique: no less, no more.
 *
 * It starts from a full random grid and removes givens one at a time. A given
 * only goes if the human-style solver can still finish the puzzle without
 * anything harder than the target, so the puzzle never needs a guess and always
 * has a single solution. When nothing more can go, the puzzle is kept only if
 * the target technique was really needed; otherwise a new grid is tried.
 *
 * The same seed always gives the same puzzle, on any device: the catalogue
 * generator relies on it to be reproducible, and the daily challenge to give
 * everyone the same sudoku on the same day.
 *
 * Self-contained apart from the solver, so scripts/ can import it directly.
 */
// The .ts extension lets Node scripts import this file without a build step.
import { TECHNIQUES, solveWithTechniques } from './humanSolver.ts';
import type { SolveResult, Technique } from './humanSolver.ts';

/** Deterministic random numbers, so a seed always gives the same puzzle. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const ROW_OF: number[] = [];
const COL_OF: number[] = [];
const BOX_OF: number[] = [];
for (let i = 0; i < 81; i++) {
  ROW_OF.push(Math.floor(i / 9));
  COL_OF.push(i % 9);
  BOX_OF.push(Math.floor(ROW_OF[i] / 3) * 3 + Math.floor(COL_OF[i] / 3));
}

/** A complete, legal grid chosen at random. */
export function randomSolution(rng: () => number): number[] {
  const grid: number[] = new Array(81).fill(0);
  const rows: number[] = new Array(9).fill(0);
  const cols: number[] = new Array(9).fill(0);
  const boxes: number[] = new Array(9).fill(0);

  const fill = (i: number): boolean => {
    if (i === 81) return true;
    const used = rows[ROW_OF[i]] | cols[COL_OF[i]] | boxes[BOX_OF[i]];
    for (const digit of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)) {
      const bit = 1 << digit;
      if (used & bit) continue;
      grid[i] = digit;
      rows[ROW_OF[i]] |= bit;
      cols[COL_OF[i]] |= bit;
      boxes[BOX_OF[i]] |= bit;
      if (fill(i + 1)) return true;
      grid[i] = 0;
      rows[ROW_OF[i]] ^= bit;
      cols[COL_OF[i]] ^= bit;
      boxes[BOX_OF[i]] ^= bit;
    }
    return false;
  };

  fill(0);
  return grid;
}

export interface DigOptions {
  /** Fewest givens allowed in any row, column or box. */
  minPerUnit?: number;
  /** Stop at this many givens instead of going as low as possible. */
  targetGivens?: number;
}

/**
 * Removes givens from `solution` while the puzzle stays solvable with
 * techniques up to `target`. Returns the puzzle and how the solver graded it.
 */
export function digForTechnique(
  solution: readonly number[],
  target: Technique,
  rng: () => number,
  { minPerUnit = 2, targetGivens = 0 }: DigOptions = {},
): { grid: number[]; givens: number; result: SolveResult } {
  const grid = [...solution];
  const rowCount: number[] = new Array(9).fill(9);
  const colCount: number[] = new Array(9).fill(9);
  const boxCount: number[] = new Array(9).fill(9);
  let givens = 81;

  for (const i of shuffled([...Array(81).keys()], rng)) {
    if (givens <= targetGivens) break;
    const r = ROW_OF[i];
    const c = COL_OF[i];
    const b = BOX_OF[i];
    if (rowCount[r] <= minPerUnit || colCount[c] <= minPerUnit || boxCount[b] <= minPerUnit) continue;

    const value = grid[i];
    grid[i] = 0;
    if (solveWithTechniques(grid, { maxTechnique: target }).status !== 'solved') {
      grid[i] = value;
      continue;
    }
    givens--;
    rowCount[r]--;
    colCount[c]--;
    boxCount[b]--;
  }

  const result = solveWithTechniques(grid, { maxTechnique: target });
  return { grid, givens, result };
}

export interface GeneratedPuzzle {
  /** 81 digits, 0 for an empty cell. */
  puzzle: string;
  solution: string;
  givens: number;
  hardest: Technique;
  /** Steps that needed the target technique. */
  hardestSteps: number;
  /** Steps beyond the two single techniques: the part a beginner cannot do. */
  advancedSteps: number;
  totalSteps: number;
  attempts: number;
}

/**
 * Tries grids until one demands exactly `target`. Returns null if none does
 * within `maxAttempts`, which for the rarest techniques is the usual outcome.
 */
export function generateForTechnique(
  target: Technique,
  seed: number,
  { minPerUnit = 2, targetGivens = 0, maxAttempts = 200 }: DigOptions & { maxAttempts?: number } = {},
): GeneratedPuzzle | null {
  if (!TECHNIQUES.includes(target)) throw new Error(`Unknown technique "${target}"`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const rng = makeRng(seed * 1_000_003 + attempt * 104_729 + 17);
    const solution = randomSolution(rng);
    const { grid, givens, result } = digForTechnique(solution, target, rng, { minPerUnit, targetGivens });
    if (result.status !== 'solved' || result.hardest !== target) continue;
    if (targetGivens > 0 && givens !== targetGivens) continue;
    return {
      puzzle: grid.join(''),
      solution: solution.join(''),
      givens,
      hardest: target,
      hardestSteps: result.counts[target],
      advancedSteps: result.steps.length - result.counts['naked-single'] - result.counts['hidden-single'],
      totalSteps: result.steps.length,
      attempts: attempt,
    };
  }
  return null;
}

/**
 * Orders puzzles that share a technique from gentler to tougher: how often the
 * technique is needed, then how many steps go beyond singles, then fewer givens.
 */
export function difficultyScore(puzzle: Pick<GeneratedPuzzle, 'hardestSteps' | 'advancedSteps' | 'givens'>): number {
  return puzzle.hardestSteps * 10_000 + puzzle.advancedSteps * 100 + (81 - puzzle.givens);
}
