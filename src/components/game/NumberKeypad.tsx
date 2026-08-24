import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { getTranslation } from '../../i18n/translations';
import { MAX_HINTS_PER_PUZZLE } from '../../utils/sudokuLogic';
import { Edit3, Eraser, Lightbulb, Pause, Play, RotateCcw, Undo2 } from 'lucide-react';

export const NumberKeypad: React.FC = () => {
  const {
    language,
    board,
    inputNumber,
    eraseCell,
    giveHint,
    undoMove,
    canUndo,
    restartPuzzle,
    isNotesMode,
    setIsNotesMode,
    isPaused,
    setIsPaused,
    hintsUsed,
  } = useGame();
  const [confirmRestart, setConfirmRestart] = useState(false);
  const hintsLeft = Math.max(0, MAX_HINTS_PER_PUZZLE - hintsUsed);

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  board.forEach((row) => {
    row.forEach((cell) => {
      if (cell.value >= 1 && cell.value <= 9 && !cell.isError) {
        counts[cell.value] = (counts[cell.value] || 0) + 1;
      }
    });
  });

  const actionClass =
    'flex flex-col items-center justify-center p-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition border border-white/10 text-white/90 disabled:opacity-35 disabled:pointer-events-none';

  return (
    <div className="w-full max-w-md mx-auto space-y-3 px-2">
      {confirmRestart && (
        <div className="rounded-2xl border border-amber-400/40 bg-black/70 p-3 text-center space-y-2">
          <p className="text-sm font-black text-white">{getTranslation(language, 'confirmRestart')}</p>
          <p className="text-[11px] text-white/70">{getTranslation(language, 'confirmRestartBody')}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirmRestart(false)}
              className="py-2 rounded-xl bg-white/10 text-xs font-bold"
            >
              {getTranslation(language, 'cancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmRestart(false);
                restartPuzzle();
              }}
              className="py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black"
            >
              {getTranslation(language, 'restart')}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-6 gap-1.5">
        <button type="button" onClick={() => setConfirmRestart(true)} className={actionClass}>
          <RotateCcw className="w-4 h-4 text-cyan-300" />
          <span className="text-[9px] font-semibold mt-1 leading-tight">
            {getTranslation(language, 'restart')}
          </span>
        </button>

        <button type="button" onClick={undoMove} disabled={!canUndo} className={actionClass}>
          <Undo2 className="w-4 h-4 text-sky-300" />
          <span className="text-[9px] font-semibold mt-1 leading-tight">
            {getTranslation(language, 'undo')}
          </span>
        </button>

        <button type="button" onClick={eraseCell} className={actionClass}>
          <Eraser className="w-4 h-4 text-rose-300" />
          <span className="text-[9px] font-semibold mt-1 leading-tight">
            {getTranslation(language, 'eraser')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsNotesMode((prev) => !prev)}
          className={`flex flex-col items-center justify-center p-2 rounded-2xl transition border active:scale-95 ${
            isNotesMode
              ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
              : 'bg-white/10 border-white/10 hover:bg-white/20 text-white/90'
          }`}
        >
          <Edit3 className="w-4 h-4 text-amber-300" />
          <span className="text-[9px] font-semibold mt-1 leading-tight">
            {getTranslation(language, 'notes')}
          </span>
        </button>

        <button
          type="button"
          onClick={giveHint}
          disabled={hintsLeft === 0}
          className={`${actionClass} relative`}
        >
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <span className="text-[9px] font-semibold mt-1 leading-tight">
            {getTranslation(language, 'hint')}
          </span>
          <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
            {hintsLeft}
          </span>
        </button>

        <button type="button" onClick={() => setIsPaused(!isPaused)} className={actionClass}>
          {isPaused ? (
            <Play className="w-4 h-4 text-emerald-400" />
          ) : (
            <Pause className="w-4 h-4 text-purple-300" />
          )}
          <span className="text-[9px] font-semibold mt-1 leading-tight">
            {isPaused ? getTranslation(language, 'resume') : getTranslation(language, 'pause')}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-9 gap-1.5 pt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const count = counts[num] || 0;
          const isFilled = count >= 9;

          return (
            <button
              key={num}
              disabled={isFilled}
              onClick={() => inputNumber(num)}
              className={`aspect-square rounded-2xl font-black text-xl sm:text-2xl flex flex-col items-center justify-center transition-all duration-150 border active:scale-90 ${
                isFilled
                  ? 'bg-black/30 border-white/5 text-white/20 cursor-not-allowed'
                  : isNotesMode
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 hover:bg-amber-900/60 shadow-lg shadow-amber-950/40'
                    : 'bg-slate-900/70 border-white/20 text-white hover:bg-slate-800/90 shadow-lg shadow-black/50'
              }`}
            >
              <span>{num}</span>
              <span className="text-[9px] font-medium opacity-60 leading-none">{9 - count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
