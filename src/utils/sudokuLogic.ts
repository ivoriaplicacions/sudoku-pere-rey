import type { Puzzle } from '../types/sudoku';
import { PACKED_PUZZLES } from '../data/puzzles';

// Check if a number placement is valid according to Sudoku rules
export function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    // Check row
    if (i !== col && board[row][i] === num) return false;
    // Check column
    if (i !== row && board[i][col] === num) return false;
  }

  // Check 3x3 subgrid
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const currR = boxRow + r;
      const currC = boxCol + c;
      if ((currR !== row || currC !== col) && board[currR][currC] === num) {
        return false;
      }
    }
  }

  return true;
}

// Solves a Sudoku using backtracking algorithm
export function solveSudoku(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Clone a 9x9 grid
export function cloneGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}

// Get valid candidate numbers for a specific cell
export function getCandidates(board: number[][], row: number, col: number): Set<number> {
  const candidates = new Set<number>();
  if (board[row][col] !== 0) return candidates;

  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      candidates.add(num);
    }
  }
  return candidates;
}

// Calculate stars earned (0 to 3) based on performance
export function calculateStars(timeSeconds: number, mistakes: number, hintsUsed: number): number {
  if (mistakes > 5) return 1;
  let points = 100;
  
  // Time deduction
  if (timeSeconds > 600) points -= 30;
  else if (timeSeconds > 300) points -= 15;

  // Mistakes & hints deduction
  points -= mistakes * 10;
  points -= hintsUsed * 15;

  if (points >= 80) return 3;
  if (points >= 50) return 2;
  return 1;
}

export const PUZZLES_PER_LEVEL = 20;
export const LEVEL_COUNT = 40;

// Expand an 81-character row-major string into a 9x9 grid.
function decodeGrid(digits: string): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < 9; r++) {
    const row: number[] = [];
    for (let c = 0; c < 9; c++) {
      row.push(digits.charCodeAt(r * 9 + c) - 48);
    }
    grid.push(row);
  }
  return grid;
}

// Puzzles are built offline by scripts/generatePuzzles.mjs, which verifies that
// each one has a single solution and keeps every row, column and box populated.
// Reading them costs a few milliseconds instead of generating at startup.
export function generateAllPuzzles(): Puzzle[] {
  return PACKED_PUZZLES.map((entry) => {
    const [level, puzzleNumber, givenCount, puzzle, solution] = entry.split('|');

    return {
      id: `L${level}_P${puzzleNumber}`,
      level: Number(level),
      puzzleNumber: Number(puzzleNumber),
      initialGrid: decodeGrid(puzzle),
      solutionGrid: decodeGrid(solution),
      givenCount: Number(givenCount),
    };
  });
}
