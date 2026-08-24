import type { CellState, HistoryCellSnapshot, HistoryEntry } from '../types/sudoku';

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
