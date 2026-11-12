import { describe, expect, it } from 'vitest';
import { solveWithTechniques } from '../../src/solver/humanSolver.ts';
import { generateForTechnique, makeRng, randomSolution } from './targetedGenerator.mjs';

const rowOf = (i) => Math.floor(i / 9);
const colOf = (i) => i % 9;
const boxOf = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
const sees = (a, b) => a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b));

/** Counts solutions by plain backtracking, with no shared code with the solver. */
function countSolutions(puzzle, limit = 2) {
  const grid = Array.from(puzzle, Number);
  let found = 0;
  const fits = (i, digit) => {
    for (let j = 0; j < 81; j++) if (grid[j] === digit && sees(i, j)) return false;
    return true;
  };
  const search = () => {
    let best = -1;
    let bestOptions = null;
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== 0) continue;
      const options = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((digit) => fits(i, digit));
      if (options.length === 0) return;
      if (!bestOptions || options.length < bestOptions.length) {
        best = i;
        bestOptions = options;
      }
    }
    if (best === -1) {
      found++;
      return;
    }
    for (const digit of bestOptions) {
      grid[best] = digit;
      search();
      grid[best] = 0;
      if (found >= limit) return;
    }
  };
  search();
  return found;
}

function unitCounts(puzzle) {
  const counts = { rows: Array(9).fill(0), cols: Array(9).fill(0), boxes: Array(9).fill(0) };
  Array.from(puzzle).forEach((ch, i) => {
    if (ch === '0') return;
    counts.rows[rowOf(i)]++;
    counts.cols[colOf(i)]++;
    counts.boxes[boxOf(i)]++;
  });
  return counts;
}

describe('randomSolution', () => {
  it('fills a legal grid', () => {
    const grid = randomSolution(makeRng(7));
    expect(grid).toHaveLength(81);
    for (let i = 0; i < 81; i++) {
      expect(grid[i]).toBeGreaterThanOrEqual(1);
      for (let j = i + 1; j < 81; j++) {
        if (sees(i, j)) expect(grid[i], `cells ${i} and ${j}`).not.toBe(grid[j]);
      }
    }
  });
});

describe('generateForTechnique', () => {
  const targets = ['naked-single', 'hidden-single', 'locked-candidates', 'naked-pair', 'xy-wing', 'short-chain'];

  it.each(targets)('builds a puzzle that demands exactly %s', (target) => {
    const made = generateForTechnique(target, 1, { maxAttempts: 400 });
    expect(made, 'no puzzle within the attempt budget').not.toBeNull();

    // The solver agrees, when asked afresh and with every technique allowed.
    const result = solveWithTechniques(made.puzzle);
    expect(result.status).toBe('solved');
    expect(result.hardest).toBe(target);
    expect(result.grid.join('')).toBe(made.solution);
    expect(made.hardestSteps).toBe(result.counts[target]);

    // Independently of the solver: one solution, and the givens belong to it.
    expect(countSolutions(made.puzzle)).toBe(1);
    Array.from(made.puzzle).forEach((ch, i) => {
      if (ch !== '0') expect(ch).toBe(made.solution[i]);
    });
    expect(made.givens).toBe(Array.from(made.puzzle).filter((ch) => ch !== '0').length);
  });

  it('gives the same puzzle for the same seed, and another for another', () => {
    const first = generateForTechnique('locked-candidates', 5);
    expect(generateForTechnique('locked-candidates', 5)).toEqual(first);
    expect(generateForTechnique('locked-candidates', 6).puzzle).not.toBe(first.puzzle);
  });

  it('keeps the asked number of givens in every row, column and box', () => {
    const made = generateForTechnique('hidden-single', 3, { minPerUnit: 3 });
    const counts = unitCounts(made.puzzle);
    expect(Math.min(...counts.rows, ...counts.cols, ...counts.boxes)).toBeGreaterThanOrEqual(3);
  });

  it('returns null when the technique does not turn up in the attempts allowed', () => {
    expect(generateForTechnique('naked-quad', 1, { maxAttempts: 3 })).toBeNull();
  });

  it('rejects a technique it does not know', () => {
    expect(() => generateForTechnique('guessing', 1)).toThrow(/Unknown technique/);
  });
});
