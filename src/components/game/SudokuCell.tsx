import React from 'react';
import type { CellState } from '../../types/sudoku';

interface SudokuCellProps {
  cell: CellState;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameNumber: boolean;
  onSelect: (row: number, col: number) => void;
}

export const SudokuCell: React.FC<SudokuCellProps> = ({
  cell,
  isSelected,
  isHighlighted,
  isSameNumber,
  onSelect,
}) => {
  const isGiven = cell.initialValue !== 0;

  let bgClasses = 'bg-slate-900/55';

  if (cell.isError) {
    bgClasses = 'bg-rose-600/50 animate-shake ring-2 ring-inset ring-rose-500';
  } else if (cell.isHint) {
    bgClasses = 'bg-amber-500/40';
  } else if (isSelected) {
    bgClasses = 'bg-cyan-500/40 ring-2 ring-inset ring-cyan-400 z-10';
  } else if (isSameNumber) {
    bgClasses = 'bg-cyan-900/55 ring-1 ring-inset ring-cyan-500/50';
  } else if (isHighlighted) {
    bgClasses = 'bg-indigo-950/65';
  }

  const numberColor = cell.isError
    ? 'text-white'
    : cell.isHint
      ? 'text-amber-200'
      : isGiven
        ? 'text-amber-300'
        : isSelected
          ? 'text-cyan-50'
          : isSameNumber
            ? 'text-cyan-200'
            : 'text-white';

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.row, cell.col)}
      className={`relative z-0 flex h-full w-full min-h-0 min-w-0 items-center justify-center border-0 p-0 m-0 select-none appearance-none transition-colors duration-150 active:brightness-110 ${bgClasses}`}
      style={{ lineHeight: 1 }}
    >
      {cell.value !== 0 ? (
        <span
          className={`${numberColor} ${isGiven || cell.isHint ? 'font-black' : 'font-semibold'}`}
          style={{
            fontSize: 'clamp(1rem, 5.2vw, 1.55rem)',
            lineHeight: 1,
            display: 'block',
          }}
        >
          {cell.value}
        </span>
      ) : cell.notes.size > 0 ? (
        <div
          className="grid h-full w-full grid-cols-3 grid-rows-3 text-cyan-300 font-medium"
          style={{ fontSize: 'clamp(0.45rem, 2.2vw, 0.65rem)', lineHeight: 1 }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <div key={n} className="flex items-center justify-center">
              {cell.notes.has(n) ? n : ''}
            </div>
          ))}
        </div>
      ) : null}
    </button>
  );
};
