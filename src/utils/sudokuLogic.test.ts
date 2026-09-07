import { describe, expect, it } from 'vitest';
import {
  calculateStars,
  cloneGrid,
  findNextPuzzle,
  generateAllPuzzles,
  getCandidates,
  isValidPlacement,
  LEVEL_COUNT,
  PUZZLES_PER_LEVEL,
  solveSudoku,
} from './sudokuLogic';
import type { Puzzle } from '../types/sudoku';

const EMPTY = (): number[][] => Array.from({ length: 9 }, () => Array(9).fill(0));

/** Counts solutions up to `cap`, so uniqueness can be asserted without solving twice. */
function countSolutions(grid: number[][], cap = 2): number {
  const work = cloneGrid(grid);
  let found = 0;

  const search = (): void => {
    if (found >= cap) return;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (work[row][col] !== 0) continue;
        for (let num = 1; num <= 9; num++) {
          if (!isValidPlacement(work, row, col, num)) continue;
          work[row][col] = num;
          search();
          work[row][col] = 0;
          if (found >= cap) return;
        }
        return;
      }
    }
    found++;
  };

  search();
  return found;
}

describe('isValidPlacement', () => {
  it('rejects a repeat in the same row, column or box', () => {
    const grid = EMPTY();
    grid[0][0] = 5;
    expect(isValidPlacement(grid, 0, 8, 5)).toBe(false);
    expect(isValidPlacement(grid, 8, 0, 5)).toBe(false);
    expect(isValidPlacement(grid, 2, 2, 5)).toBe(false);
    expect(isValidPlacement(grid, 4, 4, 5)).toBe(true);
  });

  it('ignores the cell being written, so overwriting a value is allowed', () => {
    const grid = EMPTY();
    grid[3][3] = 7;
    expect(isValidPlacement(grid, 3, 3, 7)).toBe(true);
  });
});

describe('getCandidates', () => {
  it('offers every digit on an empty board', () => {
    expect(getCandidates(EMPTY(), 0, 0).size).toBe(9);
  });

  it('offers nothing for a cell that is already filled', () => {
    const grid = EMPTY();
    grid[0][0] = 4;
    expect(getCandidates(grid, 0, 0).size).toBe(0);
  });

  it('narrows down as the row fills up', () => {
    const grid = EMPTY();
    for (let col = 0; col < 8; col++) grid[0][col] = col + 1;
    expect([...getCandidates(grid, 0, 8)]).toEqual([9]);
  });
});

describe('calculateStars', () => {
  it('awards three stars for a fast, clean solve', () => {
    expect(calculateStars(120, 0, 0)).toBe(3);
  });

  it('drops to one star past five mistakes, however fast', () => {
    expect(calculateStars(1, 6, 0)).toBe(1);
  });

  it('charges more for a hint than for a mistake', () => {
    expect(calculateStars(60, 0, 1)).toBeLessThanOrEqual(calculateStars(60, 1, 0));
  });

  it('penalises a long solve', () => {
    expect(calculateStars(601, 0, 0)).toBeLessThan(calculateStars(60, 0, 0));
  });

  it('never returns less than one star or more than three', () => {
    for (const [t, m, h] of [[0, 0, 0], [10_000, 5, 3], [900, 4, 3], [60, 2, 1]]) {
      const stars = calculateStars(t, m, h);
      expect(stars).toBeGreaterThanOrEqual(1);
      expect(stars).toBeLessThanOrEqual(3);
    }
  });
});

describe('the shipped puzzle set', () => {
  const puzzles = generateAllPuzzles();

  it('holds every level of every pack', () => {
    expect(puzzles).toHaveLength(LEVEL_COUNT * PUZZLES_PER_LEVEL);
    expect(new Set(puzzles.map((p) => p.id)).size).toBe(puzzles.length);
  });

  it('decodes into 9x9 grids whose given count matches the clues', () => {
    for (const puzzle of puzzles) {
      expect(puzzle.initialGrid).toHaveLength(9);
      expect(puzzle.solutionGrid).toHaveLength(9);
      let givens = 0;
      for (let r = 0; r < 9; r++) {
        expect(puzzle.initialGrid[r]).toHaveLength(9);
        for (let c = 0; c < 9; c++) {
          const clue = puzzle.initialGrid[r][c];
          expect(clue).toBeGreaterThanOrEqual(0);
          expect(clue).toBeLessThanOrEqual(9);
          if (clue !== 0) {
            givens++;
            // A clue must agree with the answer, or the board is unwinnable.
            expect(clue).toBe(puzzle.solutionGrid[r][c]);
          }
        }
      }
      expect(givens).toBe(puzzle.givenCount);
    }
  });

  it('ships solutions that are themselves legal boards', () => {
    for (const puzzle of puzzles) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(isValidPlacement(puzzle.solutionGrid, r, c, puzzle.solutionGrid[r][c])).toBe(true);
        }
      }
    }
  });

  // The full 800 are checked by `npm run puzzles:verify`; this keeps a sample in
  // the unit suite so a broken decoder cannot pass unnoticed.
  it('has exactly one solution for a sample across the difficulty range', () => {
    const sample = puzzles.filter((_, index) => index % 97 === 0);
    expect(sample.length).toBeGreaterThan(5);
    for (const puzzle of sample) {
      expect(countSolutions(puzzle.initialGrid)).toBe(1);
    }
  });

  it('solves back to the shipped solution', () => {
    const puzzle = puzzles[0];
    const grid = cloneGrid(puzzle.initialGrid);
    expect(solveSudoku(grid)).toBe(true);
    expect(grid).toEqual(puzzle.solutionGrid);
  });
});

describe('findNextPuzzle', () => {
  const puzzle = (level: number, puzzleNumber: number): Puzzle => ({
    id: `L${level}_P${puzzleNumber}`,
    level,
    puzzleNumber,
    initialGrid: EMPTY(),
    solutionGrid: EMPTY(),
    givenCount: 0,
  });
  const puzzles = [puzzle(1, 1), puzzle(1, 2), puzzle(2, 1)];

  it('walks to the next puzzle in the same level', () => {
    expect(findNextPuzzle(puzzles, puzzles[0], () => true)?.id).toBe('L1_P2');
  });

  it('rolls over to the next level when it is reachable', () => {
    expect(findNextPuzzle(puzzles, puzzles[1], () => true)?.id).toBe('L2_P1');
  });

  it('stops at a level the player cannot reach', () => {
    expect(findNextPuzzle(puzzles, puzzles[1], () => false)).toBeUndefined();
  });

  it('stops at the end of the set', () => {
    expect(findNextPuzzle(puzzles, puzzles[2], () => true)).toBeUndefined();
  });
});
