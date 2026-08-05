import React from 'react';
import { useGame } from '../../context/GameContext';
import { SudokuCell } from './SudokuCell';
import { themes } from '../../data/themes';

/**
 * Continuous internal grid lines. Outer frame is a matching CSS border so
 * nothing is clipped at the SVG viewBox edge.
 */
const BoardGridLines: React.FC = () => (
  <svg
    className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    viewBox="0 0 9 9"
    preserveAspectRatio="none"
    aria-hidden
  >
    {Array.from({ length: 8 }, (_, idx) => {
      const i = idx + 1;
      const major = i % 3 === 0;
      const stroke = major ? 'rgba(34, 211, 238, 0.95)' : 'rgba(255, 255, 255, 0.35)';
      const width = major ? 0.11 : 0.045;
      return (
        <g key={i}>
          <line x1={i} y1={0} x2={i} y2={9} stroke={stroke} strokeWidth={width} />
          <line x1={0} y1={i} x2={9} y2={i} stroke={stroke} strokeWidth={width} />
        </g>
      );
    })}
  </svg>
);

export const SudokuBoard: React.FC = () => {
  const { board, selectedCell, setSelectedCell, theme } = useGame();
  const themeConfig = themes[theme];

  if (!board || board.length === 0) return null;

  const selectedVal = selectedCell ? board[selectedCell.row][selectedCell.col].value : 0;

  return (
    <div
      className={`mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-3xl border border-white/20 bg-black/60 p-2.5 shadow-2xl shadow-black/80 backdrop-blur-2xl ${themeConfig.boardBorder}`}
    >
      <div
        className="relative h-full w-full rounded-md border-[3px] border-cyan-400/90 bg-slate-950/80"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gridTemplateRows: 'repeat(9, 1fr)',
        }}
      >
        <BoardGridLines />
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isSelected = selectedCell?.row === r && selectedCell?.col === c;

            const isHighlighted =
              selectedCell !== null &&
              (selectedCell.row === r ||
                selectedCell.col === c ||
                (Math.floor(selectedCell.row / 3) === Math.floor(r / 3) &&
                  Math.floor(selectedCell.col / 3) === Math.floor(c / 3)));

            const isSameNumber = selectedVal !== 0 && cell.value === selectedVal;

            return (
              <SudokuCell
                key={`${r}-${c}`}
                cell={cell}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isSameNumber={isSameNumber}
                onSelect={(rowPos, colPos) => setSelectedCell({ row: rowPos, col: colPos })}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
