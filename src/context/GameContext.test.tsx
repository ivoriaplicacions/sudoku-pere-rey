import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GameProvider, useGame } from './GameContext';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@capacitor/app', () => ({
  App: { addListener: vi.fn() },
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

let current: ReturnType<typeof useGame> | null = null;

const Probe: React.FC = () => {
  current = useGame();
  return null;
};

async function renderGame(): Promise<{ container: HTMLDivElement; root: Root }> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <GameProvider>
        <Probe />
      </GameProvider>,
    );
  });

  return { container, root };
}

async function startFirstPuzzle(): Promise<NonNullable<typeof current>['puzzles'][number]> {
  if (!current) throw new Error('Game context was not rendered');
  const puzzle = current.puzzles[0];
  await act(async () => {
    current?.startPuzzle(puzzle, { fresh: true });
  });
  return puzzle;
}

async function enterValue(row: number, col: number, value: number): Promise<void> {
  await act(async () => {
    current?.setSelectedCell({ row, col });
  });
  await act(async () => {
    current?.inputNumber(value);
  });
}

beforeEach(() => {
  localStorage.clear();
  current = null;
  vi.useFakeTimers();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.replaceChildren();
  current = null;
});

describe('GameProvider integration', () => {
  it('counts the final hints in completion rewards and saved progress', async () => {
    const { root } = await renderGame();
    const puzzle = await startFirstPuzzle();
    const emptyCells = puzzle.initialGrid.flatMap((row, rowIndex) =>
      row.flatMap((value, colIndex) => (value === 0 ? [{ row: rowIndex, col: colIndex }] : [])),
    );

    for (const position of emptyCells.slice(0, -2)) {
      await enterValue(position.row, position.col, puzzle.solutionGrid[position.row][position.col]);
    }

    await act(async () => {
      current?.giveHint();
    });
    await act(async () => {
      current?.giveHint();
    });

    expect(current?.hintsUsed).toBe(2);
    expect(current?.victoryData?.stars).toBe(2);
    expect(current?.progressMap[puzzle.id]?.hintsUsed).toBe(2);

    await act(async () => root.unmount());
  });

  it('keeps the stars a player earned before the catalogue was replaced', async () => {
    const earlier = (puzzleNumber: number, stars: number) => ({
      puzzleId: `L1_P${puzzleNumber}`,
      level: 1,
      puzzleNumber,
      completed: true,
      stars,
      bestTime: 300,
      mistakes: 0,
      hintsUsed: 0,
    });
    // No catalogue marker: this is someone arriving from the previous 800 puzzles.
    localStorage.setItem(
      'sudoku_master_progress_v1',
      JSON.stringify({ L1_P1: earlier(1, 3), L1_P2: earlier(2, 2) }),
    );
    localStorage.setItem(
      'sudoku_master_stats_v1',
      JSON.stringify({ xp: 700, playerLevel: 2, totalStars: 5, puzzlesCompleted: 2, currentStreak: 0 }),
    );

    const { root } = await renderGame();
    expect(current?.progressMap).toEqual({});
    expect(current?.playerStats.totalStars).toBe(5);
    expect(current?.playerStats.puzzlesCompleted).toBe(2);

    const puzzle = await startFirstPuzzle();
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (puzzle.initialGrid[row][col] === 0) await enterValue(row, col, puzzle.solutionGrid[row][col]);
      }
    }

    // The new puzzle is new: it counts as a completion and adds to the old stars.
    expect(current?.victoryData?.stars).toBe(3);
    expect(current?.playerStats.totalStars).toBe(8);
    expect(current?.playerStats.puzzlesCompleted).toBe(3);
    expect(current?.playerStats.xp).toBeGreaterThan(700);

    await act(async () => root.unmount());
  });

  it('counts wrong entries even when visual error feedback is disabled', async () => {
    const { root } = await renderGame();
    const puzzle = await startFirstPuzzle();
    const empty = puzzle.initialGrid
      .flatMap((row, rowIndex) =>
        row.flatMap((value, colIndex) => (value === 0 ? [{ row: rowIndex, col: colIndex }] : [])),
      )
      .at(0);

    if (!empty) throw new Error('Expected the puzzle to have an empty cell');
    const solution = puzzle.solutionGrid[empty.row][empty.col];
    const wrongValue = (solution % 9) + 1;

    await act(async () => {
      current?.setAutoCheckErrors(false);
    });
    await enterValue(empty.row, empty.col, wrongValue);

    expect(current?.mistakes).toBe(1);
    expect(current?.board[empty.row][empty.col].isError).toBe(false);

    await act(async () => root.unmount());
  });
});
