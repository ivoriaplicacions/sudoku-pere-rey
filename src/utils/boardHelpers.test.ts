import { describe, expect, it } from 'vitest';
import { cloneBoard, fillAllNotes, moveSelection, restoreHistoryEntry, snapshotHouse } from './boardHelpers';
import type { CellState } from '../types/sudoku';

const board = (): CellState[][] =>
  Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => ({
      row,
      col,
      value: 0,
      initialValue: 0,
      notes: new Set<number>(),
      isError: false,
      isHint: false,
    })),
  );

describe('fillAllNotes', () => {
  it('pencils in what the row, the column and the box still allow', () => {
    const start = board();
    start[0][0].value = 1; // same row
    start[5][4].value = 2; // same column
    start[1][3].value = 3; // same box
    start[8][8].value = 9; // unrelated

    const filled = fillAllNotes(start)!;
    expect([...filled.board[0][4].notes].sort()).toEqual([4, 5, 6, 7, 8, 9]);
    expect([...filled.board[4][0].notes].sort()).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('leaves filled cells without notes and the original board untouched', () => {
    const start = board();
    start[0][0].value = 1;
    const filled = fillAllNotes(start)!;
    expect(filled.board[0][0].notes.size).toBe(0);
    expect(filled.board[0][0].value).toBe(1);
    expect(start[0][1].notes.size).toBe(0);
  });

  it('replaces notes the player got wrong or left incomplete', () => {
    const start = board();
    start[0][0].value = 1;
    start[0][1].notes = new Set([1, 2]);
    const filled = fillAllNotes(start)!;
    expect([...filled.board[0][1].notes].sort()).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('records only the cells it changed, so one undo restores them', () => {
    const start = board();
    start[0][0].value = 1;
    start[0][1].notes = new Set([2, 5]);
    const filled = fillAllNotes(start)!;
    expect(filled.changed).toHaveLength(80);

    const restored = restoreHistoryEntry(filled.board, {
      cells: filled.changed,
      selectedCell: null,
      hintsDelta: 0,
    });
    expect([...restored[0][1].notes].sort()).toEqual([2, 5]);
    expect(restored[4][4].notes.size).toBe(0);
  });

  it('returns null when the notes are already complete', () => {
    const once = fillAllNotes(board())!;
    expect(fillAllNotes(once.board)).toBeNull();
  });
});

describe('moveSelection', () => {
  it('lands on the top-left cell on the first press', () => {
    expect(moveSelection(null, 0, 1)).toEqual({ row: 0, col: 0 });
    expect(moveSelection(null, -1, 0)).toEqual({ row: 0, col: 0 });
  });

  it('walks one cell at a time', () => {
    expect(moveSelection({ row: 4, col: 4 }, 0, 1)).toEqual({ row: 4, col: 5 });
    expect(moveSelection({ row: 4, col: 4 }, 1, 0)).toEqual({ row: 5, col: 4 });
  });

  it('stops at the edges instead of wrapping or escaping the board', () => {
    expect(moveSelection({ row: 0, col: 0 }, -1, -1)).toEqual({ row: 0, col: 0 });
    expect(moveSelection({ row: 8, col: 8 }, 1, 1)).toEqual({ row: 8, col: 8 });
  });
});

describe('cloneBoard', () => {
  it('copies notes rather than sharing the Set', () => {
    const original = board();
    original[0][0].notes.add(5);
    const copy = cloneBoard(original);
    copy[0][0].notes.add(9);
    expect([...original[0][0].notes]).toEqual([5]);
  });
});

describe('snapshotHouse', () => {
  it('captures the row, column and box exactly once each', () => {
    // 9 + 9 + 9 cells, minus the 4 the box shares with the row and column,
    // minus the cell itself counted three times.
    expect(snapshotHouse(board(), 0, 0)).toHaveLength(21);
  });
});

describe('restoreHistoryEntry', () => {
  it('puts back the values and notes an undo captured', () => {
    const before = board();
    before[3][3].value = 7;
    before[3][4].notes.add(2);
    const entry = { cells: snapshotHouse(before, 3, 3), selectedCell: null, hintsDelta: 0 };

    const changed = cloneBoard(before);
    changed[3][3].value = 1;
    changed[3][4].notes.clear();

    const restored = restoreHistoryEntry(changed, entry);
    expect(restored[3][3].value).toBe(7);
    expect([...restored[3][4].notes]).toEqual([2]);
  });
});
