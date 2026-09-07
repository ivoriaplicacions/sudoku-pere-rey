import React from 'react';
import type { CellState, ThemeConfig } from '../../types/sudoku';

interface SudokuCellProps {
  cell: CellState;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameNumber: boolean;
  theme: ThemeConfig;
  /** Spoken description of the cell, built by the board which knows the language. */
  label: string;
  onSelect: (row: number, col: number) => void;
}

export const SudokuCell: React.FC<SudokuCellProps> = ({
  cell,
  isSelected,
  isHighlighted,
  isSameNumber,
  theme,
  label,
  onSelect,
}) => {
  const isGiven = cell.initialValue !== 0;

  let bgClasses = theme.cellIdle;

  if (cell.isError) {
    bgClasses = theme.cellError;
  } else if (cell.isHint) {
    bgClasses = theme.cellHint;
  } else if (isSelected) {
    bgClasses = theme.cellSelected;
  } else if (isSameNumber) {
    bgClasses = theme.cellSame;
  } else if (isHighlighted) {
    bgClasses = theme.cellHighlight;
  }

  const numberColor = cell.isError
    ? 'text-white'
    : cell.isHint
      ? 'text-amber-200'
      : isGiven
        ? theme.givenText
        : isSelected
          ? theme.selectedText
          : isSameNumber
            ? theme.sameText
            : theme.userText;

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.row, cell.col)}
      aria-label={label}
      aria-pressed={isSelected}
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
          className={`grid h-full w-full grid-cols-3 grid-rows-3 font-medium ${theme.notesText}`}
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
