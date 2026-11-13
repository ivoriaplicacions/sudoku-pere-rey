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

/** Opens a hint, reads it to the end and takes the digit it offers. */
async function takeWholeHint(): Promise<void> {
  await act(async () => {
    current?.giveHint();
  });
  const frames = current?.activeHint?.hint.frames.length ?? 0;
  for (let i = 1; i < frames; i++) {
    await act(async () => {
      current?.advanceHint();
    });
  }
  await act(async () => {
    current?.placeHint();
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

    await takeWholeHint();
    await takeWholeHint();

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

  it('explains a hint for free and only counts it when the digit is placed', async () => {
    const { root } = await renderGame();
    const puzzle = await startFirstPuzzle();

    await act(async () => {
      current?.giveHint();
    });
    const hint = current?.activeHint?.hint;
    expect(hint?.frames[0].kind).toBe('zone');
    expect(hint?.frames.length).toBeGreaterThanOrEqual(2);
    expect(current?.hintsUsed).toBe(0);

    // The digit cannot be taken before the explanation has been read.
    await act(async () => {
      current?.placeHint();
    });
    expect(current?.hintsUsed).toBe(0);
    expect(current?.activeHint).not.toBeNull();

    for (let i = 1; i < (hint?.frames.length ?? 0); i++) {
      await act(async () => {
        current?.advanceHint();
      });
    }
    expect(current?.hintsUsed).toBe(0);

    await act(async () => {
      current?.placeHint();
    });
    const { row, col, digit } = hint!.placement!;
    expect(digit).toBe(puzzle.solutionGrid[row][col]);
    expect(current?.board[row][col].value).toBe(digit);
    expect(current?.board[row][col].isHint).toBe(true);
    expect(current?.hintsUsed).toBe(1);
    expect(current?.activeHint).toBeNull();

    await act(async () => root.unmount());
  });

  it('fills every candidate in one go and takes it back with one undo', async () => {
    const { root } = await renderGame();
    const puzzle = await startFirstPuzzle();

    await act(async () => {
      current?.fillNotes();
    });
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = current!.board[row][col];
        if (puzzle.initialGrid[row][col] !== 0) {
          expect(cell.notes.size).toBe(0);
        } else {
          // The answer is always among the notes of an empty cell.
          expect(cell.notes.has(puzzle.solutionGrid[row][col])).toBe(true);
        }
      }
    }
    expect(current?.canUndo).toBe(true);
    expect(current?.hintsUsed).toBe(0);

    await act(async () => {
      current?.undoMove();
    });
    expect(current?.board.flat().every((cell) => cell.notes.size === 0)).toBe(true);
    expect(current?.canUndo).toBe(false);

    await act(async () => root.unmount());
  });

  describe('the daily challenge', () => {
    const DATE = '2026-11-13';

    async function startDaily(date = DATE) {
      await act(async () => {
        const started = current!.startDailyChallenge(date);
        vi.advanceTimersByTime(50);
        await started;
      });
    }

    async function solveCurrent() {
      const puzzle = current!.selectedPuzzle!;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (puzzle.initialGrid[row][col] === 0) await enterValue(row, col, puzzle.solutionGrid[row][col]);
        }
      }
    }

    it('is open to a new player who has unlocked nothing, and leaves the level list alone', async () => {
      const { root } = await renderGame();
      expect(current?.canPlayLevel(7)).toBe(false);
      await startDaily();
      expect(current?.view).toBe('game');
      expect(current?.selectedPuzzle?.id).toBe(`D${DATE}`);
      expect(current?.selectedPuzzle?.daily?.date).toBe(DATE);
      expect(current?.selectedLevel).toBe(1);
      await act(async () => root.unmount());
    });

    it('is recorded under its date, counts as a completion and offers no next sudoku', async () => {
      const { root } = await renderGame();
      await startDaily();
      await solveCurrent();
      expect(current?.victoryData?.stars).toBe(3);
      expect(current?.progressMap[`D${DATE}`]).toMatchObject({ completed: true, stars: 3, level: 0 });
      expect(current?.playerStats.puzzlesCompleted).toBe(1);

      await act(async () => current?.closeVictoryModal());
      expect(current?.view).toBe('level-select');
      await act(async () => root.unmount());
    });

    it('leaves to the level list, not to a level that does not exist', async () => {
      const { root } = await renderGame();
      await startDaily();
      await act(async () => current?.exitToMenu());
      expect(current?.view).toBe('level-select');

      // A level sudoku still goes back to its own list.
      await startFirstPuzzle();
      await act(async () => current?.exitToMenu());
      expect(current?.view).toBe('puzzle-select');
      await act(async () => root.unmount());
    });

    it('can be resumed after the app is closed halfway', async () => {
      const first = await renderGame();
      await startDaily();
      const puzzle = current!.selectedPuzzle!;
      const empty = puzzle.initialGrid.flat().indexOf(0);
      await enterValue(Math.floor(empty / 9), empty % 9, puzzle.solutionGrid[Math.floor(empty / 9)][empty % 9]);
      await act(async () => first.root.unmount());

      const second = await renderGame();
      expect(current?.savedDailySession?.puzzleId).toBe(`D${DATE}`);
      expect(current?.savedSession).toBeNull();
      await act(async () => current?.resumeSession('daily'));
      expect(current?.view).toBe('game');
      expect(current?.selectedPuzzle?.daily?.date).toBe(DATE);
      expect(current?.board[Math.floor(empty / 9)][empty % 9].value).toBe(
        puzzle.solutionGrid[Math.floor(empty / 9)][empty % 9],
      );
      await act(async () => second.root.unmount());
    });
  });

  describe('a level game and the daily challenge in progress at the same time', () => {
    const DATE = '2026-11-13';
    const firstEmpty = (grid: number[][]) => {
      const index = grid.flat().indexOf(0);
      return { row: Math.floor(index / 9), col: index % 9 };
    };

    async function startDaily() {
      await act(async () => {
        const started = current!.startDailyChallenge(DATE);
        vi.advanceTimersByTime(50);
        await started;
      });
    }

    it('starting the daily challenge keeps the level game halfway through', async () => {
      const { root } = await renderGame();
      const level = await startFirstPuzzle();
      const cell = firstEmpty(level.initialGrid);
      await enterValue(cell.row, cell.col, level.solutionGrid[cell.row][cell.col]);

      await startDaily();
      expect(current?.selectedPuzzle?.daily?.date).toBe(DATE);
      expect(current?.savedSession?.puzzleId).toBe(level.id);

      // Back to the level game: the digit entered before is still there.
      await act(async () => current?.exitToMenu());
      await act(async () => current?.resumeSession('level'));
      expect(current?.selectedPuzzle?.id).toBe(level.id);
      expect(current?.board[cell.row][cell.col].value).toBe(level.solutionGrid[cell.row][cell.col]);
      await act(async () => root.unmount());
    });

    it('and the other way round: a level game keeps the daily challenge halfway through', async () => {
      const { root } = await renderGame();
      await startDaily();
      const daily = current!.selectedPuzzle!;
      const cell = firstEmpty(daily.initialGrid);
      await enterValue(cell.row, cell.col, daily.solutionGrid[cell.row][cell.col]);

      await startFirstPuzzle();
      expect(current?.savedDailySession?.puzzleId).toBe(daily.id);

      // Playing the same day again picks the challenge up where it was left.
      await startDaily();
      expect(current?.board[cell.row][cell.col].value).toBe(daily.solutionGrid[cell.row][cell.col]);
      await act(async () => root.unmount());
    });

    it('both survive closing the app', async () => {
      const first = await renderGame();
      const level = await startFirstPuzzle();
      await startDaily();
      await act(async () => first.root.unmount());

      const second = await renderGame();
      expect(current?.savedSession?.puzzleId).toBe(level.id);
      expect(current?.savedDailySession?.puzzleId).toBe(`D${DATE}`);
      await act(async () => second.root.unmount());
    });

    it('finishing the daily challenge clears only its own slot', async () => {
      const { root } = await renderGame();
      const level = await startFirstPuzzle();
      await startDaily();
      const daily = current!.selectedPuzzle!;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (daily.initialGrid[row][col] === 0) await enterValue(row, col, daily.solutionGrid[row][col]);
        }
      }
      expect(current?.victoryData).not.toBeNull();
      expect(current?.savedDailySession).toBeNull();
      expect(current?.savedSession?.puzzleId).toBe(level.id);
      await act(async () => root.unmount());
    });
  });

  describe('digit-first mode', () => {
    const emptyCellsOf = (puzzle: { initialGrid: number[][] }) =>
      puzzle.initialGrid.flatMap((row, r) => row.flatMap((value, c) => (value === 0 ? [{ row: r, col: c }] : [])));

    it('is off by default, so a digit key still writes into the selected cell', async () => {
      const { root } = await renderGame();
      const puzzle = await startFirstPuzzle();
      const [first] = emptyCellsOf(puzzle);
      expect(current?.digitFirst).toBe(false);

      await enterValue(first.row, first.col, puzzle.solutionGrid[first.row][first.col]);
      expect(current?.board[first.row][first.col].value).toBe(puzzle.solutionGrid[first.row][first.col]);
      expect(current?.armedDigit).toBeNull();

      await act(async () => root.unmount());
    });

    it('picks a digit up with its key and writes it into the cells tapped', async () => {
      const { root } = await renderGame();
      const puzzle = await startFirstPuzzle();
      await act(async () => current?.setDigitFirst(true));

      const [first] = emptyCellsOf(puzzle);
      const digit = puzzle.solutionGrid[first.row][first.col];
      const second = emptyCellsOf(puzzle).find(
        (cell) =>
          (cell.row !== first.row || cell.col !== first.col) && puzzle.solutionGrid[cell.row][cell.col] === digit,
      )!;

      // The key alone writes nothing, even with a cell selected.
      await act(async () => current?.setSelectedCell(first));
      await act(async () => current?.inputNumber(digit));
      expect(current?.armedDigit).toBe(digit);
      expect(current?.board[first.row][first.col].value).toBe(0);

      await act(async () => current?.tapCell(first.row, first.col));
      await act(async () => current?.tapCell(second.row, second.col));
      expect(current?.board[first.row][first.col].value).toBe(digit);
      expect(current?.board[second.row][second.col].value).toBe(digit);
      expect(current?.armedDigit).toBe(digit);
      expect(current?.mistakes).toBe(0);

      await act(async () => root.unmount());
    });

    it('never overwrites another digit, and leaves givens alone', async () => {
      const { root } = await renderGame();
      const puzzle = await startFirstPuzzle();
      await act(async () => current?.setDigitFirst(true));

      const [first] = emptyCellsOf(puzzle);
      const right = puzzle.solutionGrid[first.row][first.col];
      const other = (right % 9) + 1;

      await act(async () => current?.inputNumber(right));
      await act(async () => current?.tapCell(first.row, first.col));
      await act(async () => current?.inputNumber(other));
      expect(current?.armedDigit).toBe(other);
      await act(async () => current?.tapCell(first.row, first.col));
      expect(current?.board[first.row][first.col].value).toBe(right);

      const given = puzzle.initialGrid.flat().findIndex((value) => value !== 0);
      await act(async () => current?.tapCell(Math.floor(given / 9), given % 9));
      expect(current?.board[Math.floor(given / 9)][given % 9].value).toBe(puzzle.initialGrid.flat()[given]);
      expect(current?.selectedCell).toEqual({ row: Math.floor(given / 9), col: given % 9 });
      expect(current?.mistakes).toBe(0);

      await act(async () => root.unmount());
    });

    it('takes the digit back out of a cell tapped again, and puts it down with its key', async () => {
      const { root } = await renderGame();
      const puzzle = await startFirstPuzzle();
      await act(async () => current?.setDigitFirst(true));
      const [first] = emptyCellsOf(puzzle);
      const digit = puzzle.solutionGrid[first.row][first.col];

      await act(async () => current?.inputNumber(digit));
      await act(async () => current?.tapCell(first.row, first.col));
      await act(async () => current?.tapCell(first.row, first.col));
      expect(current?.board[first.row][first.col].value).toBe(0);

      await act(async () => current?.inputNumber(digit));
      expect(current?.armedDigit).toBeNull();
      await act(async () => current?.tapCell(first.row, first.col));
      expect(current?.board[first.row][first.col].value).toBe(0);

      await act(async () => root.unmount());
    });

    it('puts the digit down once all nine are on the board, and when the mode is turned off', async () => {
      const { root } = await renderGame();
      const puzzle = await startFirstPuzzle();
      await act(async () => current?.setDigitFirst(true));
      const [first] = emptyCellsOf(puzzle);
      const digit = puzzle.solutionGrid[first.row][first.col];

      await act(async () => current?.inputNumber(digit));
      for (const cell of emptyCellsOf(puzzle)) {
        if (puzzle.solutionGrid[cell.row][cell.col] !== digit) continue;
        await act(async () => current?.tapCell(cell.row, cell.col));
      }
      expect(current?.board.flat().filter((cell) => cell.value === digit)).toHaveLength(9);
      expect(current?.armedDigit).toBeNull();

      await act(async () => current?.inputNumber((digit % 9) + 1));
      expect(current?.armedDigit).toBe((digit % 9) + 1);
      await act(async () => current?.setDigitFirst(false));
      expect(current?.armedDigit).toBeNull();
      expect(localStorage.getItem('maestros_digit_first_v1')).toBe('false');

      await act(async () => root.unmount());
    });

    it('remembers the setting for the next launch', async () => {
      localStorage.setItem('maestros_digit_first_v1', 'true');
      const { root } = await renderGame();
      expect(current?.digitFirst).toBe(true);
      await act(async () => root.unmount());
    });
  });

  it('closes an open hint as soon as the board changes', async () => {
    const { root } = await renderGame();
    const puzzle = await startFirstPuzzle();
    await act(async () => {
      current?.giveHint();
    });
    expect(current?.activeHint).not.toBeNull();

    const empty = puzzle.initialGrid.flat().indexOf(0);
    const row = Math.floor(empty / 9);
    const col = empty % 9;
    await enterValue(row, col, puzzle.solutionGrid[row][col]);
    expect(current?.activeHint).toBeNull();

    await act(async () => root.unmount());
  });

  it('points at a wrong digit instead of explaining a step built on it', async () => {
    const { root } = await renderGame();
    const puzzle = await startFirstPuzzle();
    const empty = puzzle.initialGrid.flat().indexOf(0);
    const row = Math.floor(empty / 9);
    const col = empty % 9;
    await enterValue(row, col, (puzzle.solutionGrid[row][col] % 9) + 1);

    await act(async () => {
      current?.giveHint();
    });
    expect(current?.activeHint?.hint.frames).toHaveLength(1);
    expect(current?.activeHint?.hint.frames[0].kind).toBe('mistake');
    expect(current?.activeHint?.hint.frames[0].target).toBe(empty);
    expect(current?.activeHint?.hint.placement).toBeNull();

    await act(async () => root.unmount());
  });

  it('keeps explaining after the three hints are spent, but places nothing more', async () => {
    const { root } = await renderGame();
    await startFirstPuzzle();
    await takeWholeHint();
    await takeWholeHint();
    await takeWholeHint();
    expect(current?.hintsUsed).toBe(3);

    const filledBefore = current?.board.flat().filter((cell) => cell.value !== 0).length;
    await takeWholeHint();
    expect(current?.hintsUsed).toBe(3);
    expect(current?.board.flat().filter((cell) => cell.value !== 0).length).toBe(filledBefore);
    expect(current?.activeHint).not.toBeNull();

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
