import type { CellPosition, CellState, HistoryCellSnapshot, HistoryEntry } from '../types/sudoku';

export function cloneBoard(board: CellState[][]): CellState[][] {
  return board.map((row) => row.map((cell) => ({ ...cell, notes: new Set(cell.notes) })));
}

export function snapshotCell(cell: CellState): HistoryCellSnapshot {
  return {
    row: cell.row,
    col: cell.col,
    value: cell.value,
    notes: [...cell.notes],
    isError: cell.isError,
    isHint: cell.isHint,
  };
}

function forEachHouseCell(row: number, col: number, visit: (r: number, c: number) => void): void {
  const seen = new Set<string>();
  const go = (r: number, c: number) => {
    const key = `${r}-${c}`;
    if (seen.has(key)) return;
    seen.add(key);
    visit(r, c);
  };

  for (let i = 0; i < 9; i++) {
    go(row, i);
    go(i, col);
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      go(r, c);
    }
  }
}

export function snapshotHouse(board: CellState[][], row: number, col: number): HistoryCellSnapshot[] {
  const snaps: HistoryCellSnapshot[] = [];
  forEachHouseCell(row, col, (r, c) => {
    snaps.push(snapshotCell(board[r][c]));
  });
  return snaps;
}

export function clearNotesForDigit(board: CellState[][], row: number, col: number, digit: number): void {
  forEachHouseCell(row, col, (r, c) => {
    board[r][c].notes.delete(digit);
  });
}

/**
 * Automatic notes: every empty cell gets the digits its row, column and box
 * still allow. Returns the new board and the cells that changed, for undo, or
 * null when the notes were already exactly that.
 *
 * It reads the digits on the board as they are. A wrong digit therefore hides a
 * candidate somewhere, the same as it would for someone pencilling by hand.
 */
export function fillAllNotes(
  board: CellState[][],
): { board: CellState[][]; changed: HistoryCellSnapshot[] } | null {
  const next = cloneBoard(board);
  const changed: HistoryCellSnapshot[] = [];

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = board[row][col];
      if (cell.value !== 0) continue;

      const used = new Set<number>();
      forEachHouseCell(row, col, (r, c) => {
        if (board[r][c].value !== 0) used.add(board[r][c].value);
      });
      const notes = new Set<number>();
      for (let digit = 1; digit <= 9; digit++) if (!used.has(digit)) notes.add(digit);

      const same = notes.size === cell.notes.size && [...notes].every((digit) => cell.notes.has(digit));
      if (same) continue;
      changed.push(snapshotCell(cell));
      next[row][col].notes = notes;
    }
  }

  return changed.length > 0 ? { board: next, changed } : null;
}

export function restoreHistoryEntry(board: CellState[][], entry: HistoryEntry): CellState[][] {
  const next = cloneBoard(board);
  for (const snap of entry.cells) {
    const cell = next[snap.row][snap.col];
    cell.value = snap.value;
    cell.notes = new Set(snap.notes);
    cell.isError = snap.isError;
    cell.isHint = snap.isHint;
  }
  return next;
}

/**
 * Arrow-key movement, clamped to the board. With nothing selected yet the first
 * press lands on the top-left cell rather than moving from nowhere.
 */
export function moveSelection(
  from: CellPosition | null,
  rowDelta: number,
  colDelta: number,
): CellPosition {
  if (!from) return { row: 0, col: 0 };
  return {
    row: Math.min(8, Math.max(0, from.row + rowDelta)),
    col: Math.min(8, Math.max(0, from.col + colDelta)),
  };
}
